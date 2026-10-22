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
  servicios.html  "servicios" — los 6 servicios y los 2 packs, texto fijo
  about.html      "sobre mí" — no carga projects.js
  photos.html     "proyectos" — índice: 1 portada por proyecto, cada una linkea a su álbum; el render está INLINE
  proyecto.html   álbum de un proyecto: proyecto.html?p=<slug>, lo arma renderAlbum()
  css/style.css   732 líneas, todo el diseño
  js/projects.js  los datos de los proyectos — GENERADO por scripts/sync_drive.py
  js/main.js      920 líneas, los 13 efectos
  img/<slug>/     imágenes optimizadas, 1080×1350; el nombre es el hash del original

scripts/sync_drive.py   trae los proyectos de Drive, optimiza y regenera projects.js
proyectos.json          registro de qué original generó cada foto publicada
.github/workflows/pages.yml   sincroniza con Drive y publica (a mano o con cada merge a main)

alba/ lepla/ rose/ rue-daisy/   originales full-size, 186 MB — NO están en git
```

## Dónde tocar qué

**Contenido de proyectos → la carpeta `web-proyectos` de Google Drive.**
No se edita `projects.js` a mano: lo regenera `scripts/sync_drive.py` y lo
que se cambie ahí se pisa. La carpeta es de quien sube las fotos; la cuenta
de servicio `web-sync` la lee (secret `GDRIVE_SA_KEY`, variable
`GDRIVE_FOLDER_ID`).

| en Drive | en la web |
|---|---|
| subcarpeta `01 lepla` | proyecto "lepla"; el número es el orden y no se muestra |
| fotos, por nombre | orden del álbum; la primera es la portada |
| foto `…-ancha.jpg` | ocupa 2 columnas — es lo que le da ritmo a la grilla |
| `info.txt` con `tags: …` | los tags de la portada (opcional) |

Si Drive no devuelve ningún proyecto con fotos, el script frena en vez de
vaciar la web. Para probar sin Drive, con la misma estructura en el disco:

```bash
python3 scripts/sync_drive.py --local ~/Desktop/web-proyectos-subir --dry-run
```

(las dependencias están en `scripts/requirements.txt`, pineadas). En la
pestaña Actions, "run workflow" sincroniza y publica, y con `dry_run` solo
muestra qué cambiaría. No hay sincronización programada: lo que se suba a
Drive entra con ese botón o con el próximo merge a `main`.

**Diseño → `site/css/style.css`.** Variables en `:root`: paleta
(`--white`/`--black`/`--grey`), grilla (`--cols: 12`, `--gap: 10px`,
`--edge: 5px`) y tipografías. El archivo está dividido en secciones con
comentarios `/* === TÍTULO === */` — respetá esa organización al agregar reglas.

**Efectos → `site/js/main.js`.** Numerados del 1 al 13 con comentarios de
bloque que explican qué hace cada uno y por qué. Todo se dispara desde el
`DOMContentLoaded` del final. Si agregás un efecto, seguí el patrón:
función `initAlgo()` con su comentario numerado, y la llamada al arranque.

## Flujo de trabajo

Cada cambio, por chico que sea, sigue estos pasos:

1. **Branch nueva desde `main` actualizado.** Nunca se trabaja directo sobre
   `main` ni sobre una branch vieja:
   ```bash
   git fetch origin
   git switch -c <nombre-corto> origin/main
   ```
2. **Verificar en local antes de commitear.** Levantar `python3 serve.py`,
   abrir http://localhost:4321 y confirmar que la página carga bien, que la
   consola del browser no tiene errores, y que el cambio se ve como se pidió
   (en desktop y en mobile). Si algo no se pudo verificar, decirlo, no
   commitear "a ciegas".
3. **Commits que digan qué tipo de cambio son**, con un prefijo y la
   descripción en castellano simple:
   - `fix:` arregla algo que estaba roto → `fix: la portada de rose salía cortada`
   - `feature:` agrega algo nuevo → `feature: la home muestra solo el titular`
   - `refactor:` reordena código sin cambiar lo que se ve → `refactor: saca renderProjects de la home`

## Convenciones

- **Todo en español y en minúscula.** Los textos de la UI, los comentarios del
  código y los nombres de sección van en minúscula — es una decisión de diseño,
  no un descuido. No "arregles" la capitalización.
- Comentarios en español, explicando el *porqué* del efecto, no el cómo.
- Sin dependencias instaladas: Lenis y GSAP (+ Flip, ScrollTrigger) entran por
  CDN de jsDelivr con versión pineada. Si agregás una lib, pineá la versión igual.
- Las imágenes no se optimizan a mano: `sync_drive.py` las lleva a 1350px
  de lado mayor y calidad 72 (lo mismo que hacía `sips -Z 1350`), y corrige
  la rotación de las fotos de celular.

## Trampas conocidas

- **`photos.html` tiene un `<script>` inline** (a partir de la línea 85) que
  arma el índice de proyectos: una portada por proyecto y el resto de las
  piezas serializadas en `data-frames`. No está en `main.js`, pero el efecto
  que las va pasando en hover (`initWorkHover()`, nº 13) sí — si tocás uno,
  mirá el otro.
- **El archivo se sigue llamando `photos.html`** aunque la página se llame
  "proyectos". Renombrarlo implica tocar los cinco `<nav>` y el link de vuelta en `renderAlbum()`.
- **Las portadas se recortan a 1.727:1** (`.work-thumb`). Es el único lugar
  del sitio donde una imagen se recorta: las piezas son 4:5 y de la portada
  se ve una franja horizontal del centro.
- **`about.html` no carga `projects.js`.** `renderAlbum()` chequea
  `typeof PROJECTS === 'undefined'` y sale; no lo rompas.
- **La versión `?v=` de los links a css y js la agrega el deploy**, sobre la
  copia que se publica (no se commitea). Por eso en el repo los `.html`
  linkean `css/style.css` a secas: no lo "arregles".
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
