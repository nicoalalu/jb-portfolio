#!/usr/bin/env python3
"""Sincroniza los proyectos de la web con la carpeta `web-proyectos` de Drive.

Cada subcarpeta es un proyecto ("01 lepla", "02 rue daisy"...): el número
define el orden y no se muestra. Adentro van las fotos, ordenadas por nombre
(la primera es la portada); las que terminan en "-ancha" ocupan 2 columnas.
Un info.txt opcional con "tags: identidad, packaging" completa la portada.

El script baja solo lo que cambió, lo optimiza igual que hacíamos con sips
(lado mayor 1350px, calidad 72) y regenera site/js/projects.js. Las fotos se
guardan con el hash del original como nombre: si la foto cambia, cambia el
nombre, y el browser nunca muestra una versión vieja de la caché.

Uso:
  python3 scripts/sync_drive.py                 # lee Drive (GDRIVE_SA_KEY + GDRIVE_FOLDER_ID)
  python3 scripts/sync_drive.py --local CARPETA # misma estructura, desde el disco
  python3 scripts/sync_drive.py --dry-run       # muestra qué haría, sin tocar nada
"""

import argparse
import hashlib
import io
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()  # para las fotos del iPhone (.heic)

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / 'site' / 'img'
PROJECTS_JS = RAIZ / 'site' / 'js' / 'projects.js'
REGISTRO = RAIZ / 'proyectos.json'  # qué original generó cada foto publicada

LADO_MAYOR = 1350
CALIDAD = 72
EXTENSIONES = {'.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'}

DRIVE = 'https://www.googleapis.com/drive/v3/files'
CARPETA_DRIVE = 'application/vnd.google-apps.folder'
DOC_DRIVE = 'application/vnd.google-apps.document'


# --- nombres --------------------------------------------------------------

def leer_carpeta(nombre):
    """"01 rue daisy" → (1, "rue daisy"). Sin número, va al final."""
    m = re.match(r'^\s*(\d+)[\s._-]+(.+?)\s*$', nombre)
    if m:
        return int(m.group(1)), m.group(2).strip().lower()
    return 10**6, nombre.strip().lower()


def a_slug(nombre):
    s = unicodedata.normalize('NFKD', nombre).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return s or 'proyecto'


def clave_natural(nombre):
    """Orden "humano": 2.jpg antes que 10.jpg."""
    return [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', nombre.lower())]


def es_ancha(nombre):
    return Path(nombre).stem.lower().rstrip().endswith('-ancha')


def leer_tags(texto):
    for linea in texto.splitlines():
        k, _, v = linea.partition(':')
        if k.strip().lower() == 'tags':
            return v.strip().lower()
    return ''


# --- fuentes: Drive o una carpeta local, con la misma interfaz ------------

class FuenteLocal:
    def __init__(self, raiz):
        self.raiz = Path(raiz)

    def proyectos(self):
        for d in sorted(p for p in self.raiz.iterdir() if p.is_dir()):
            fotos, info = [], None
            for f in d.iterdir():
                if f.name.lower() == 'info.txt':
                    info = f
                elif f.suffix.lower() in EXTENSIONES:
                    fotos.append({'id': str(f), 'name': f.name,
                                  'md5': hashlib.md5(f.read_bytes()).hexdigest()})
            yield d.name, fotos, (info.read_text(encoding='utf-8') if info else '')

    def bajar(self, foto):
        return Path(foto['id']).read_bytes()


class FuenteDrive:
    def __init__(self, clave_json, carpeta_id):
        import requests
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account

        cred = service_account.Credentials.from_service_account_info(
            json.loads(clave_json),
            scopes=['https://www.googleapis.com/auth/drive.readonly'],
        )
        cred.refresh(Request())
        self.http = requests.Session()
        self.http.headers['Authorization'] = f'Bearer {cred.token}'
        self.carpeta_id = carpeta_id

    def _listar(self, padre):
        params = {
            'q': f"'{padre}' in parents and trashed = false",
            'fields': 'nextPageToken, files(id, name, mimeType, md5Checksum)',
            'pageSize': 1000,
            'supportsAllDrives': 'true',
            'includeItemsFromAllDrives': 'true',
        }
        while True:
            r = self.http.get(DRIVE, params=params, timeout=60)
            r.raise_for_status()
            data = r.json()
            yield from data.get('files', [])
            if 'nextPageToken' not in data:
                return
            params['pageToken'] = data['nextPageToken']

    def proyectos(self):
        carpetas = [f for f in self._listar(self.carpeta_id) if f['mimeType'] == CARPETA_DRIVE]
        for c in sorted(carpetas, key=lambda f: f['name']):
            fotos, info = [], ''
            for f in self._listar(c['id']):
                if f['name'].lower() in ('info.txt', 'info'):
                    info = self._texto(f)
                elif Path(f['name']).suffix.lower() in EXTENSIONES and f.get('md5Checksum'):
                    fotos.append({'id': f['id'], 'name': f['name'], 'md5': f['md5Checksum']})
            yield c['name'], fotos, info

    def _texto(self, f):
        # info.txt puede ser un .txt subido o un documento creado en Drive
        if f['mimeType'] == DOC_DRIVE:
            url, params = f"{DRIVE}/{f['id']}/export", {'mimeType': 'text/plain'}
        else:
            url, params = f"{DRIVE}/{f['id']}", {'alt': 'media'}
        r = self.http.get(url, params=params, timeout=60)
        r.raise_for_status()
        return r.content.decode('utf-8-sig', errors='replace')

    def bajar(self, foto):
        r = self.http.get(f"{DRIVE}/{foto['id']}", params={'alt': 'media'}, timeout=300)
        r.raise_for_status()
        return r.content


# --- optimización ---------------------------------------------------------

def optimizar(datos):
    img = Image.open(io.BytesIO(datos))
    img = ImageOps.exif_transpose(img)  # las fotos de celular vienen "acostadas"
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img.thumbnail((LADO_MAYOR, LADO_MAYOR), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, 'JPEG', quality=CALIDAD, optimize=True, progressive=True)
    return out.getvalue()


# --- sincronización -------------------------------------------------------

def leer_proyectos(fuente):
    proyectos = []
    for carpeta, fotos, info in fuente.proyectos():
        if not fotos:
            print(f'  · "{carpeta}" no tiene fotos, se saltea')
            continue
        orden, nombre = leer_carpeta(carpeta)
        fotos.sort(key=lambda f: clave_natural(f['name']))
        proyectos.append({'orden': orden, 'name': nombre, 'slug': a_slug(nombre),
                          'tags': leer_tags(info), 'fotos': fotos})
    proyectos.sort(key=lambda p: (p['orden'], p['name']))

    vistos = set()
    for p in proyectos:  # dos carpetas con el mismo nombre no se pisan
        base, n = p['slug'], 2
        while p['slug'] in vistos:
            p['slug'], n = f'{base}-{n}', n + 1
        vistos.add(p['slug'])
    return proyectos


def sincronizar(fuente, dry_run):
    proyectos = leer_proyectos(fuente)
    if not proyectos:
        # Drive vacío o mal compartido: antes que borrar la web entera, frenar.
        sys.exit('no se encontró ningún proyecto con fotos — no se toca nada')

    registro = json.loads(REGISTRO.read_text()) if REGISTRO.exists() else {}
    nuevo_registro, salida, bajadas = {}, [], 0

    for p in proyectos:
        carpeta = IMG / p['slug']
        imagenes = []
        for i, foto in enumerate(p['fotos'], start=1):
            archivo = foto['md5'][:12] + '.jpg'
            destino = carpeta / archivo
            if not destino.exists():
                bajadas += 1
                print(f"  + {p['slug']}/{archivo}  ← {foto['name']}")
                if not dry_run:
                    carpeta.mkdir(parents=True, exist_ok=True)
                    destino.write_bytes(optimizar(fuente.bajar(foto)))
            nuevo_registro[f"{p['slug']}/{archivo}"] = foto['name']
            imagenes.append({'file': archivo, 'label': f"{p['slug']}_{i:03d}.jpg",
                             'wide': es_ancha(foto['name'])})
        salida.append({'slug': p['slug'], 'name': p['name'], 'tags': p['tags'],
                       'images': imagenes})

    # lo que ya no está en Drive sale de la web
    borradas = 0
    if IMG.exists():
        for f in sorted(IMG.glob('*/*.jpg')):
            if f"{f.parent.name}/{f.name}" not in nuevo_registro:
                borradas += 1
                print(f'  - {f.parent.name}/{f.name}')
                if not dry_run:
                    f.unlink()
        if not dry_run:
            for d in IMG.iterdir():
                if d.is_dir() and not any(d.iterdir()):
                    d.rmdir()

    print(f'{len(salida)} proyectos · {bajadas} fotos nuevas · {borradas} borradas')
    for p in salida:
        anchas = [i for i, im in enumerate(p['images'], 1) if im['wide']]
        print(f"  {p['slug']}: {len(p['images'])} fotos, anchas {anchas or '—'}, tags «{p['tags']}»")
    if dry_run:
        return

    PROJECTS_JS.write_text(generar_js(salida), encoding='utf-8')
    REGISTRO.write_text(json.dumps(nuevo_registro, indent=2, ensure_ascii=False,
                                   sort_keys=True) + '\n', encoding='utf-8')


def generar_js(proyectos):
    datos = json.dumps(proyectos, indent=2, ensure_ascii=False)
    return f'''/* ---------------------------------------------------------------------------
   DATOS DE LOS PROYECTOS — ARCHIVO GENERADO, NO EDITAR A MANO
   ---------------------------------------------------------------------------
   Lo escribe scripts/sync_drive.py a partir de la carpeta web-proyectos de
   Drive. Para cambiar un proyecto, cambialo en Drive: lo que se edite acá se
   pisa en la próxima sincronización.
--------------------------------------------------------------------------- */

const PROJECTS = {datos};
'''


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--local', help='leer de una carpeta del disco en lugar de Drive')
    ap.add_argument('--dry-run', action='store_true', help='mostrar qué haría sin tocar nada')
    args = ap.parse_args()

    if args.local:
        fuente = FuenteLocal(args.local)
    else:
        clave, carpeta = os.environ.get('GDRIVE_SA_KEY'), os.environ.get('GDRIVE_FOLDER_ID')
        if not clave or not carpeta:
            sys.exit('faltan GDRIVE_SA_KEY y/o GDRIVE_FOLDER_ID')
        fuente = FuenteDrive(clave, carpeta)

    sincronizar(fuente, args.dry_run)


if __name__ == '__main__':
    main()
