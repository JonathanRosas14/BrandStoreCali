/* =====================================================================
   CATÁLOGO — única fuente de datos de productos.
   Lo usan la portada (carrusel), el catálogo, la búsqueda, los filtros y la ficha.
   Los precios son DE EJEMPLO (COP). Cámbialos por los reales.

   Para agregar un producto:
   1. Pon su imagen PNG/WebP con fondo transparente en Assets/web/
   2. Regístrala en js/media.js (IMG e ITEM)
   3. Agrega un objeto aquí abajo con un "id" único y su "media"
   ===================================================================== */
const CATEGORIES = [
  { id: "audio",  name: "Audio",         desc: "AirPods y audífonos" },
  { id: "carga",  name: "Cargadores",    desc: "Adaptadores USB-C" },
  { id: "cables", name: "Cables",        desc: "USB-C y Lightning" },
  { id: "kits",   name: "Kits y combos", desc: "Ahorra comprando junto" }
];

/*  Campos de cada producto
    id, cat           identificador único y categoría (id de CATEGORIES)
    name, short, tag  nombre, descripción corta (tarjeta) y descripción larga (ficha)
    word              palabra grande que va detrás del producto
    color, tone       color de fondo y color de la palabra grande
    media             recortes de imagen (claves de ITEM en js/media.js); los kits llevan varios
    price, old        precio y precio anterior (opcional). Las variantes pueden tener su propio precio
    vars, varLabel    variantes: { label, swatch?, price?, old? }
    feats, box        características y contenido de la caja
    parts             (kits) ids de los productos incluidos; el precio anterior se calcula solo
    isNew             marca "Nuevo"                                                        */
const PRODUCTS = [
  {
    id: "pro2", cat: "audio", name: "AirPods Pro 2", word: "Pro 2", color: "#1F5FD6", tone: "#4A85F0", media: ["pro2"],
    price: 70000, old: 85000,
    short: "Cancelación de ruido activa y estuche MagSafe con USB-C.",
    tag: "Cancelación de ruido activa, audio adaptativo y estuche MagSafe con USB-C.",
    varLabel: "Color", vars: [{ label: "Blanco", swatch: "#F4F5F7" }],
    feats: ["Cancelación activa de ruido y modo Ambiente", "Audio Espacial personalizado", "Hasta 6 h de reproducción, hasta 30 h con el estuche", "Resistencia al polvo, sudor y agua (IP54)"],
    box: "AirPods Pro 2, estuche de carga MagSafe (USB-C), almohadillas XS, S, M y L, cable USB-C."
  },
  {
    id: "pro3", cat: "audio", name: "AirPods Pro 3", word: "Pro 3", color: "#0F2C6E", tone: "#244A9E", media: ["pro3"],
    price: 85000, isNew: true,
    short: "La cancelación de ruido más potente, con sensor de ritmo cardíaco.",
    tag: "La cancelación de ruido más potente de AirPods, con sensor de frecuencia cardíaca.",
    varLabel: "Color", vars: [{ label: "Blanco", swatch: "#F4F5F7" }],
    feats: ["Cancelación activa de ruido de nueva generación", "Sensor de frecuencia cardíaca para entrenamientos", "Hasta 8 h de reproducción con cancelación de ruido", "Resistencia al polvo, sudor y agua (IP57)"],
    box: "AirPods Pro 3, estuche de carga (USB-C), almohadillas en 5 tamaños (XXS a L)."
  },
  {
    id: "max", cat: "audio", name: "AirPods Max", word: "Max", color: "#566CD2", tone: "#7489E4", media: ["max"],
    price: 125000, old: 150000,
    short: "Audífonos de diadema de alta fidelidad, en 5 colores.",
    tag: "Audífonos de diadema con sonido de alta fidelidad y cancelación activa de ruido.",
    varLabel: "Color", vars: [{ label: "Blanco estelar", swatch: "#E9E1D4" }, { label: "Naranja", swatch: "#F3A57E" }, { label: "Morado", swatch: "#B9AEE0" }, { label: "Azul", swatch: "#7C8EA3" }, { label: "Medianoche", swatch: "#2C3138" }],
    feats: ["Cancelación activa de ruido y modo Ambiente", "Audio Espacial con seguimiento dinámico de la cabeza", "Hasta 20 h de batería, carga por USB-C", "Corona Digital para volumen y llamadas"],
    box: "AirPods Max, Smart Case, cable USB-C."
  },
  {
    id: "c20", cat: "carga", name: "Cargador USB-C 20W", word: "20W", color: "#0A7AB8", tone: "#2E94CC", media: ["c20"],
    price: 75000, old: 90000,
    short: "Carga rápida para iPhone, AirPods y iPad.",
    tag: "Carga rápida para iPhone, AirPods y iPad desde un adaptador compacto.",
    varLabel: "Versión", vars: [{ label: "20W · USB-C" }],
    feats: ["Carga rápida: hasta 50 % en unos 30 minutos en iPhone compatible", "Puerto USB-C", "Compatible con iPhone, iPad y AirPods", "Tamaño compacto para llevar"],
    box: "Adaptador de corriente USB-C de 20W."
  },
  {
    id: "c40", cat: "carga", name: "Cargador Dinámico 40W", word: "40W", color: "#25314B", tone: "#37476B", media: ["c40"],
    price: 120000, isNew: true,
    short: "40W dinámicos que suben hasta 60W cuando hace falta.",
    tag: "40W de carga dinámica que entrega hasta 60W cuando tu equipo lo pide.",
    varLabel: "Versión", vars: [{ label: "40W · hasta 60W" }],
    feats: ["Potencia dinámica de 40W, hasta 60W máximo", "Carga rápida para los iPhone más recientes", "También carga iPad y MacBook Air", "Puerto USB-C, diseño compacto"],
    box: "Adaptador de corriente dinámico de 40W (USB-C)."
  },
  {
    id: "usbc", cat: "cables", name: "Cable USB-C trenzado", word: "USB-C", color: "#3A4FD9", tone: "#5C70EE", media: ["usbc"],
    price: 70000,
    short: "Cable tejido de 60W para iPhone, iPad y Mac.",
    tag: "Cable tejido resistente para cargar y sincronizar tus equipos USB-C.",
    varLabel: "Largo", vars: [{ label: "1 m", price: 70000 }],
    feats: ["Diseño trenzado que resiste los enredos", "Carga hasta 60W", "Transferencia de datos USB 2", "Para iPhone 15 o posterior, iPad, Mac y AirPods"],
    box: "Cable de carga USB-C a USB-C."
  },
  {
    id: "light", cat: "cables", name: "Cable USB-C a Lightning", word: "Lightning", color: "#1167B8", tone: "#3A85D2", media: ["light"],
    price: 60000,
    short: "Carga rápida para iPhone con conector Lightning.",
    tag: "Carga rápida para iPhone con Lightning usando un adaptador USB-C.",
    varLabel: "Largo", vars: [{ label: "1 m", price: 60000, old: 75000 }],
    feats: ["Carga rápida con adaptador USB-C de 18W o más", "Sincroniza fotos, música y archivos", "Compatible con iPhone, iPad y AirPods con Lightning", "Conectores reforzados"],
    box: "Cable USB-C a Lightning."
  },
  {
    id: "kit-iphone", cat: "kits", name: "Kit Carga Rápida iPhone", word: "Kit", color: "#0A7AB8", tone: "#2E94CC", media: ["c20", "light"],
    parts: ["c20", "light"], price: 125000,
    short: "Cargador 20W + cable USB-C a Lightning de 1 m.",
    tag: "Todo lo que necesitas para cargar rápido un iPhone con conector Lightning.",
    varLabel: "Contenido", vars: [{ label: "20W + Lightning 1 m" }],
    feats: ["Carga rápida: hasta 50 % en unos 30 minutos en iPhone compatible", "Cargador USB-C de 20W", "Cable USB-C a Lightning de 1 m", "Cuesta menos que comprar cada producto por separado"],
    box: "Adaptador de corriente USB-C de 20W y cable USB-C a Lightning (1 m)."
  },
  {
    id: "kit-usbc", cat: "kits", name: "Kit Carga Rápida USB-C", word: "Kit", color: "#3A4FD9", tone: "#5C70EE", media: ["c20", "usbc"],
    parts: ["c20", "usbc"], price: 135000,
    short: "Cargador 20W + cable USB-C trenzado de 1 m.",
    tag: "El kit de carga rápida para iPhone 15 o posterior, iPad y AirPods con USB-C.",
    varLabel: "Contenido", vars: [{ label: "20W + USB-C 1 m" }],
    feats: ["Cargador USB-C de 20W", "Cable USB-C trenzado de 1 m", "Para iPhone 15 o posterior, iPad y AirPods", "Cuesta menos que comprar cada producto por separado"],
    box: "Adaptador de corriente USB-C de 20W y cable USB-C trenzado (1 m)."
  },
  {
    id: "kit-pro", cat: "kits", name: "Kit Carga Pro 40W", word: "Pro", color: "#25314B", tone: "#37476B", media: ["c40", "usbc"],
    parts: ["c40", "usbc"], price: 180000,
    layout: [[40, 48, 58], [74, 57, 58]],
    short: "Cargador dinámico 40W + cable USB-C trenzado.",
    tag: "La carga más rápida para tu iPhone reciente, con potencia de sobra para iPad y MacBook Air.",
    varLabel: "Contenido", vars: [{ label: "40W + USB-C 1 m" }],
    feats: ["Cargador dinámico de 40W, hasta 60W", "Cable USB-C trenzado de 60W", "También carga iPad y MacBook Air", "Cuesta menos que comprar cada producto por separado"],
    box: "Adaptador de corriente dinámico de 40W y cable USB-C trenzado (1 m)."
  },
  {
    id: "kit-viaje", cat: "kits", name: "Kit Viajero", word: "Viaje", color: "#1167B8", tone: "#3A85D2", media: ["c40", "usbc", "light"],
    parts: ["c40", "usbc", "light"], price: 250000, isNew: true,
    short: "Cargador 40W + cable USB-C + cable Lightning.",
    tag: "Un solo cargador y dos cables para cargar todos tus equipos cuando sales de casa.",
    varLabel: "Contenido", vars: [{ label: "40W + USB-C + Lightning" }],
    feats: ["Cargador dinámico de 40W, hasta 60W", "Cable USB-C trenzado de 1 m", "Cable USB-C a Lightning de 1 m", "Cuesta menos que comprar cada producto por separado"],
    box: "Adaptador de 40W, cable USB-C trenzado (1 m) y cable USB-C a Lightning (1 m)."
  },
  {
    id: "combo-pro3", cat: "kits", name: "Combo AirPods Pro 3 + 20W", word: "Combo", color: "#0F2C6E", tone: "#244A9E", media: ["pro3", "c20"],
    parts: ["pro3", "c20"], price: 160000, isNew: true,
    short: "AirPods Pro 3 con cargador USB-C de 20W.",
    tag: "Estrena tus AirPods Pro 3 con un cargador rápido para el estuche y tu iPhone.",
    varLabel: "Contenido", vars: [{ label: "AirPods Pro 3 + 20W" }],
    feats: ["AirPods Pro 3 con cancelación activa de ruido", "Cargador USB-C de 20W", "Carga el estuche y tu iPhone con el mismo adaptador", "Cuesta menos que comprar cada producto por separado"],
    box: "AirPods Pro 3, estuche de carga (USB-C), almohadillas en 5 tamaños y adaptador USB-C de 20W."
  }
];

/* ---------- derived fields (no editar) ---------- */
(() => {
  const minPrice = p => Math.min(...p.vars.map(v => v.price ?? p.price));
  PRODUCTS.forEach((p, i) => {
    p.rank = i;
    if (p.parts) p.old = p.parts.reduce((sum, id) => sum + minPrice(PRODUCTS.find(x => x.id === id)), 0);
  });
})();
