# Sitio — réplica de maximiliankaspar.com

Réplica de la referencia, con las imágenes reales de los cuatro proyectos.
Punto de partida para iterar.

## Cómo verlo

```bash
python3 -m http.server 4321 --directory site
```

Después, abrir http://localhost:4321

## Estructura

```
site/
  index.html      home: solo el titular, una pantalla sin scroll
  servicios.html  "servicios" — los 6 servicios y los 2 packs, texto fijo
  about.html      "sobre mí"
  photos.html     "proceso": todas las piezas mezcladas en una grilla densa
  proyecto.html   álbum de un proyecto: proyecto.html?p=<slug>, lo arma renderAlbum()
  css/style.css   todo el diseño
  js/projects.js  los datos de los proyectos — generado desde Drive, no editar
  js/main.js      los 14 efectos
  img/            imágenes optimizadas (1600×2000, ~350 kB c/u)
```

Las carpetas originales (`alba/`, `lepla/`, `rose/`, `rue-daisy/`) quedaron
intactas en la raíz del proyecto. `site/img/` son copias reducidas: 187 MB → 11 MB.

## Para cambiar el contenido

Los proyectos salen de la carpeta **`web-proyectos`** de Google Drive: cada
subcarpeta (`01 lepla`, `02 rue daisy`…) es un proyecto, y sus fotos, en
orden de nombre, el álbum. Las que terminan en `-ancha` ocupan doble ancho.
Para que entren a la web, se corre a mano el workflow (pestaña Actions →
"run workflow"), o entran solos con el próximo merge a `main`: la GitHub
Action trae los cambios, optimiza las fotos, regenera `js/projects.js` y
publica. El detalle está en `CLAUDE.md`.

## ⚠️ Antes de publicar

- **Los textos son provisorios.** Nombre del estudio, bio, descripciones de
  proyecto, clientes y años están inventados. Buscar `TODO` en el código.
- **Las tipografías** son Space Grotesk y Space Mono (Google Fonts, libres).
  Las de la referencia — Bugrino y Neue Montreal — son licencia paga.

## Los efectos

| # | Efecto | Dónde |
|---|--------|-------|
| 1 | Scroll con inercia | Lenis |
| 2 | Nav que se invierte sobre cualquier fondo | `mix-blend-mode: difference` |
| 3 | Cuadradito ■ que parpadea al pasar el cursor | CSS, `@keyframes blink` |
| 4 | "scroll down" persigue al mouse con retraso | `initCursorTag()` |
| 5 | El titular se agranda hasta llenar el hero | `fitHeadline()` |
| 6 | Encabezado de proyecto → negro en golpe seco | CSS, `transition-delay` asimétrico |
| 7 | Los proyectos se abren solos al scrollear | `IntersectionObserver` |
| 8 | Acordeón: altura, textos que suben, + que rota a × | `initAccordions()` |
| 9 | Imágenes que entran con retraso al azar | ScrollTrigger + `Math.random()` |
| 10 | Clic en foto → la grilla se reacomoda | GSAP Flip |
| 11 | Transición entre páginas: 4 columnas negras | `initPageTransition()` |
| 12 | Tres capas de grilla de fondo | CSS + `buildPixelGrid()` |
| 13 | Fondo ASCII animado | `initAscii()` |
| 14 | Nombres de archivo como epígrafes | `renderProjects()` |

**Huevos de pascua:** `Shift + G` muestra la grilla de 12 columnas.
La tecla `A` activa el modo escáner sobre el titular.
