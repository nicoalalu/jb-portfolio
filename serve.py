#!/usr/bin/env python3
"""Server de desarrollo para el sitio.

Igual que `python3 -m http.server --directory site`, pero manda
`Cache-Control: no-store` en cada respuesta. Sin eso, Chrome cachea el HTML
de forma heurística (el módulo estándar no manda ni Cache-Control ni ETag)
y te sirve una versión vieja sin consultar al servidor — el síntoma es
editar un archivo, recargar, y seguir viendo lo de antes.
"""

import functools
import http.server

PUERTO = 4321


class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    handler = functools.partial(SinCache, directory='site')
    with http.server.ThreadingHTTPServer(('', PUERTO), handler) as httpd:
        print(f'sitio en http://localhost:{PUERTO}  (sin caché)')
        httpd.serve_forever()
