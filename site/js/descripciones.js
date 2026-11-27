/* ---------------------------------------------------------------------------
   TEXTOS DE CADA ÁLBUM — ESTE SÍ SE EDITA A MANO
   ---------------------------------------------------------------------------
   projects.js lo pisa el sync de drive, así que el subtítulo y la descripción
   de cada proyecto viven acá, por slug. renderAlbum() los muestra debajo del
   título; si un proyecto no tiene entrada, el álbum sale solo con el nombre.
--------------------------------------------------------------------------- */

const DESCRIPCIONES = {
  'lepla': {
    subtitulo: 'naming · identidad visual · packaging · dirección de arte · redes sociales',
    texto: 'creación integral de una marca de vajilla y cristalería, desde su conceptualización hasta el desarrollo de su identidad visual. diseño de packaging, papelería comercial y piezas gráficas. desarrollo de la propuesta estética para redes sociales, curaduría de referencias visuales para campañas fotográficas y creación y gestión de contenido para instagram.',
  },
  'core-pilates': {
    subtitulo: 'naming · identidad visual · aplicaciones de marca · redes sociales',
    texto: 'conceptualización y desarrollo de la identidad visual de un estudio de pilates contemporáneo, explorando el movimiento como eje conceptual de la marca. diseño de logotipo, sistema gráfico, merchandising, stickers y piezas de comunicación para redes sociales.',
  },
  'alba': {
    subtitulo: 'naming · identidad visual · aplicaciones de marca',
    texto: 'creación de una identidad visual integral de una cafetería, desde el desarrollo del nombre y logotipo hasta la definición de su universo gráfico. diseño de menú, tarjetas de fidelización, cartelería y distintas aplicaciones de marca.',
  },
  'rose': {
    subtitulo: 'naming · identidad visual · packaging · aplicaciones de marca',
    texto: 'conceptualización y desarrollo de la identidad visual de una marca de skincare. creación del nombre, logotipo, paleta cromática y sistema gráfico. diseño de packaging, papelería y distintas aplicaciones de marca.',
  },
  'la-rando': {
    subtitulo: 'diseño gráfico · comunicación digital · redes sociales',
    texto: 'diseño de piezas gráficas para la comunicación digital de la marca, incluyendo publicaciones e historias para instagram, en consonancia con su identidad visual preexistente y su universo estético.',
  },
  'racimo': {
    subtitulo: 'identidad visual · ilustraciones · aplicaciones de marca · redes sociales',
    texto: 'desarrollo de la identidad visual de un bar. diseño de logotipo, recursos gráficos e ilustraciones propias de la marca. aplicación de la identidad en stickers, cajas de fósforos y piezas de comunicación para redes sociales.',
  },
};
