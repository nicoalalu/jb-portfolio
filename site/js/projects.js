/* ---------------------------------------------------------------------------
   DATOS DE LOS PROYECTOS
   ---------------------------------------------------------------------------
   ⚠️  TEXTOS PROVISORIOS — TODO: reemplazar con el contenido real.
   Los nombres de proyecto y las imágenes son reales. Las descripciones,
   clientes, años y créditos son inventados para poder evaluar el diseño.
   No publicar el sitio sin reemplazarlos.

   Cómo agregar/editar un proyecto:
   - `slug`  : nombre de la carpeta dentro de site/img/
   - `prefix`: prefijo de los archivos ya optimizados (lp_001.jpg → 'lp')
   - `count` : cuántas imágenes tiene
   - `wide`  : índices (base 1) que ocupan 2 columnas en vez de 1.
               Sirve para dar ritmo a la grilla sin recortar ninguna imagen.
--------------------------------------------------------------------------- */

const PROJECTS = [
  {
    slug: 'lepla',
    name: 'lepla',
    tags: 'identidad, packaging',
    year: '2024',
    description:
      'lepla nace del deseo de transformar la mesa en un espacio de arte. la identidad combina una tipografía de palo seco muy marcada con una firma manuscrita, sobre un rosa empolvado que atraviesa todas las piezas. el sistema busca el equilibrio entre lo artesanal y lo contemporáneo.',
    meta: [
      ['cliente', 'lepla'],
      ['web', 'lepla.com.ar'],
      ['rubro', 'vajilla y accesorios'],
    ],
    prefix: 'lp',
    count: 8,
    wide: [2, 5],
  },
  {
    slug: 'rue-daisy',
    name: 'rue daisy',
    tags: 'identidad, etiquetas',
    year: '2024',
    description:
      'identidad para una marca de indumentaria de lana. el logotipo manuscrito se apoya en un azul grisáceo y un crudo de papel, con lunares como recurso gráfico recurrente. las etiquetas y los sellos completan un sistema de aire vintage sin caer en la nostalgia literal.',
    meta: [
      ['cliente', 'rue daisy'],
      ['web', 'ruedaisy.com'],
      ['rubro', 'indumentaria'],
    ],
    prefix: 'rd',
    count: 8,
    wide: [3, 6],
  },
  {
    slug: 'alba',
    name: 'alba',
    tags: 'naming, identidad',
    year: '2025',
    description:
      'construcción de un logotipo manuscrito de trazo continuo, pensado para funcionar tanto en gran escala como en aplicaciones mínimas. el amarillo saturado y el blanco puro sostienen toda la identidad, sin necesidad de recursos gráficos adicionales.',
    meta: [
      ['cliente', 'alba'],
      ['web', 'alba.studio'],
      ['rubro', 'estudio creativo'],
    ],
    prefix: 'al',
    count: 7,
    wide: [1, 4],
  },
  {
    slug: 'rose',
    name: 'rose',
    tags: 'identidad, dirección de arte',
    year: '2025',
    description:
      'identidad para una marca de cuidado facial con base en madrid. el sistema es estrictamente blanco y negro: una serif de contraste bajo, pictogramas sólidos de producto y fotografía de piel sin retoque. el color queda reservado enteramente a la imagen.',
    meta: [
      ['cliente', 'rose face & skin care'],
      ['web', 'rose-skin.com'],
      ['rubro', 'cosmética'],
    ],
    prefix: 'rs',
    count: 8,
    wide: [2, 7],
  },
];
