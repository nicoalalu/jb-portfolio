# design-web

Sitio de portfolio para un estudio de diseño gráfico. HTML/CSS/JS a mano, sin
build step, sin framework, sin `package.json`. Todo lo que se sirve vive en `site/`.

Es una página web de una agencia de diseño creativo.

## Cómo correrlo

```bash
python3 serve.py
```

Después, http://localhost:4321. Hay un `.claude/launch.json` con la config
`site` para levantarlo desde las herramientas de preview.

Usá `serve.py` y no `python3 -m http.server`: el módulo estándar no manda
`Cache-Control` ni `ETag`, así que Chrome cachea el HTML de forma heurística
y te sirve la versión vieja sin consultar al servidor. El síntoma es editar
un archivo, recargar, y seguir viendo lo de antes.

No hay tests, ni linter, ni CI. La verificación es visual: levantar el server,
mirar la página y revisar la consola del browser.

## Estructura

```
site/
  index.html      home: solo el titular, una pantalla sin scroll
  about.html      "sobre mí" — no carga projects.js
  photos.html     "proyectos" — índice: 1 portada por proyecto; el render está INLINE
  css/style.css   732 líneas, todo el diseño
  js/projects.js  los datos de los 4 proyectos
  js/main.js      920 líneas, los 13 efectos
  img/<slug>/     imágenes optimizadas, 1080×1350, ~150 kB c/u

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

**Efectos → `site/js/main.js`.** Numerados del 1 al 13 con comentarios de
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
  sips -s format jpeg -s formatOptions 72 -Z 1350 original.jpg --out site/img/carpeta/xx_001.jpg
  ```

## Trampas conocidas

- **`photos.html` tiene un `<script>` inline** (a partir de la línea 85) que
  arma el índice de proyectos: una portada por proyecto y el resto de las
  piezas serializadas en `data-frames`. No está en `main.js`, pero el efecto
  que las va pasando en hover (`initWorkHover()`, nº 13) sí — si tocás uno,
  mirá el otro.
- **El archivo se sigue llamando `photos.html`** aunque la página se llame
  "proyectos". Renombrarlo implica tocar los tres `<nav>`.
- **Las portadas se recortan a 1.727:1** (`.work-thumb`). Es el único lugar
  del sitio donde una imagen se recorta: las piezas son 4:5 y de la portada
  se ve una franja horizontal del centro.
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
