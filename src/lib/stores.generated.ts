/**
 * Этот файл создан scripts/build-stores.mjs.
 * Не редактируйте его вручную — изменяйте content/stores/<key>/store.md.
 */
export const GENERATED_STORE_BRANDS = [
  {
    "key": "evroopt",
    "label": "Евроопт",
    "defaultStoreName": "Евроопт",
    "defaultCardColor": "#8fc641",
    "match": [
      "\\bевроопт\\b",
      "\\bevroopt\\b"
    ],
    "description": "Сеть магазинов «Евроопт».",
    "logoSrc": "/store-logos/evroopt.svg"
  },
  {
    "key": "gippo",
    "label": "Гиппо",
    "defaultStoreName": "Гиппо",
    "defaultCardColor": "#e95d1f",
    "match": [
      "\\bгиппо\\b",
      "\\bgippo\\b"
    ],
    "description": "Сеть магазинов «Гиппо».",
    "logoSrc": "/store-logos/gippo.png"
  },
  {
    "key": "green",
    "label": "Грин",
    "defaultStoreName": "Green",
    "defaultCardColor": "#0da018",
    "match": [
      "\\bgreen\\b",
      "\\bгрин\\b"
    ],
    "description": "Сеть магазинов Green.",
    "logoSrc": "/store-logos/green.svg"
  },
  {
    "key": "korona",
    "label": "Корона",
    "defaultStoreName": "Корона",
    "defaultCardColor": "#f9683a",
    "match": [
      "\\bкорона\\b",
      "\\bkorona\\b"
    ],
    "description": "Сеть магазинов «Корона».",
    "logoSrc": "/store-logos/korona.svg"
  },
  {
    "key": "oma",
    "label": "ОМА",
    "defaultStoreName": "ОМА",
    "defaultCardColor": "#0da018",
    "match": [
      "\\bома\\b",
      "\\boma\\b"
    ],
    "description": "Сеть магазинов ОМА.",
    "logoSrc": "/store-logos/oma.png"
  },
  {
    "key": "ostin",
    "label": "Ostin",
    "defaultStoreName": "Ostin",
    "defaultCardColor": "#1b1b1b",
    "match": [
      "\\bостин\\b",
      "\\bostin\\b"
    ],
    "description": "Сеть магазинов Ostin.",
    "logoSrc": "/store-logos/ostin.png"
  },
  {
    "key": "prostore",
    "label": "ProStore",
    "defaultStoreName": "ProStore",
    "defaultCardColor": "#042d95",
    "match": [
      "\\bpro\\s?store\\b",
      "\\bпростор\\b"
    ],
    "description": "Сеть магазинов ProStore.",
    "logoSrc": "/store-logos/prostore.png"
  },
  {
    "key": "sosedi",
    "label": "Соседи",
    "defaultStoreName": "Соседи",
    "defaultCardColor": "#0081c9",
    "match": [
      "\\bсоседи\\b",
      "\\bsosedi\\b"
    ],
    "description": "Сеть магазинов «Соседи».",
    "logoSrc": "/store-logos/sosedi.png"
  },
  {
    "key": "tri-ceny",
    "label": "Три цены",
    "defaultStoreName": "Три цены",
    "defaultCardColor": "#0088d0",
    "match": [
      "\\bтри\\s*цены\\b",
      "\\b3\\s*цены\\b",
      "\\b3цены\\b",
      "\\b3ceni\\b",
      "\\btri\\s*ceny\\b"
    ],
    "description": "Сеть магазинов «Три цены».",
    "logoSrc": "/store-logos/tri-ceny.png"
  },
  {
    "key": "varka",
    "label": "VARKA",
    "defaultStoreName": "VARKA",
    "defaultCardColor": "#1b1b1b",
    "match": [
      "\\bvarka\\b",
      "\\bварка\\b"
    ],
    "description": "Сеть магазинов VARKA.",
    "logoSrc": "/store-logos/varka.svg"
  }
] as const;

export type GeneratedStoreBrandKey = (typeof GENERATED_STORE_BRANDS)[number]["key"];
