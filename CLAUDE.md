# design-web

Sitio de portfolio para un estudio de diseño gráfico. HTML/CSS/JS a mano, sin
build step, sin framework, sin `package.json`. Todo lo que se sirve vive en `site/`.

Es una **réplica de maximiliankaspar.com**: la estructura, la grilla y los 14
efectos están reproducidos 1:1 a partir de la referencia. Tenelo presente antes
de sugerir publicarlo con dominio propio o hacer el repo público.

## Cómo correrlo

```bash
python3 -m http.server 4321 --directory site
```

Después, http://localhost:4321. Hay un `.claude/launch.json` con la config
`site` para levantarlo desde las herramientas de preview.

No hay tests, ni linter, ni CI. La verificación es visual: levantar el server,
mirar la página y revisar la consola del browser.

## Estructura

```
site/
  index.html      home: hero + los 4 proyectos en acordeón
  about.html      "sobre mí" — no carga projects.js
  photos.html     "proceso" — grilla densa; el shuffle está INLINE en el HTML
  css/style.css   637 líneas, todo el diseño
  js/projects.js  los datos de los 4 proyectos
  js/main.js      849 líneas, los 14 efectos
  img/<slug>/     imágenes optimizadas, 1600×2000, ~350 kB c/u

alba/ lepla/ rose/ rue-daisy/   originales full-size, 186 MB — NO están en git
```

## Dónde tocar qué

**Contenido de proyectos → `site/js/projects.js`.** Es el archivo que más se
edita. Cada entrada del array `PROJECTS`:

| campo | qué es |
|---|---|
| `slug` | nombre de la carpeta en `site/img/` |
| `prefix` | prefijo de los archivos (`lp_001.jpg` → `'lp'`) |
| `count` | cuántas imágenes tiene el proyecto |
| `wide` | índices base-1 que ocupan 2 columnas — es lo que le da ritmo a la grilla |
| `meta` | pares `[etiqueta, valor]` que salen en el acordeón |

`renderProjects()` en `main.js` arma el HTML desde acá. Si cambiás `count`
sin agregar el archivo, la imagen sale rota (no hay validación).

**Diseño → `site/css/style.css`.** Variables en `:root`: paleta
(`--white`/`--black`/`--grey`), grilla (`--cols: 12`, `--gap: 10px`,
`--edge: 5px`) y tipografías. El archivo está dividido en secciones con
comentarios `/* === TÍTULO === */` — respetá esa organización al agregar reglas.

**Efectos → `site/js/main.js`.** Numerados del 1 al 12 con comentarios de
bloque que explican qué hace cada uno y por qué. Todo se dispara desde el
`DOMContentLoaded` del final. Si agregás un efecto, seguí el patrón:
función `initAlgo()` con su comentario numerado, y la llamada al arranque.

## Convenciones

- **Todo en español y en minúscula.** Los textos de la UI, los comentarios del
  código y los nombres de sección van en minúscula — es una decisión de diseño,
  no un descuido. No "arregles" la capitalización.
- Comentarios en español, explicando el *porqué* del efecto, no el cómo.
- Sin dependencias instaladas: Lenis y GSAP (+ Flip, ScrollTrigger) entran por
  CDN de jsDelivr con versión pineada. Si agregás una lib, pineá la versión igual.
- Las imágenes nuevas se optimizan con `sips`:
  ```bash
  sips -s format jpeg -s formatOptions 72 -Z 2000 original.jpg --out site/img/carpeta/xx_001.jpg
  ```

## Trampas conocidas

- **`photos.html` tiene un `<script>` inline** (líneas 85-109) que arma la
  grilla mezclada. No está en `main.js`. Si cambiás la estructura del markup
  de las imágenes en `renderProjects()`, hay que replicarlo ahí a mano — están
  duplicados.
- **`about.html` no carga `projects.js`.** `renderProjects()` chequea
  `typeof PROJECTS === 'undefined'` y sale; no lo rompas.
- **El truco central del diseño es `mix-blend-mode: difference`** en la nav:
  texto blanco que se invierte sobre cualquier fondo. Si algo se ve "al revés"
  o desaparece, mirá ahí antes que nada.
- **El titular se autodimensiona** con `fitHeadline()`, que mide y escala hasta
  llenar el hero. No le pongas un `font-size` fijo por CSS.
- `reduceMotion` está declarado al principio de `main.js` — respetalo en
  cualquier animación nueva.

## Huevos de pascua

- `Shift + G` → muestra la grilla de debug de 12 columnas
- tecla `A` → modo escáner sobre el titular

## ⚠️ Antes de publicar

- **Todos los textos son provisorios e inventados.** Nombre del estudio, bio,
  descripciones de proyecto, clientes, años y URLs. Buscar `TODO` en el código.
  Las imágenes y los nombres de proyecto sí son reales.
- **Las tipografías son sustitutos libres.** Space Grotesk + Space Mono, en
  lugar de Bugrino y Neue Montreal de la referencia, que son licencia paga.
