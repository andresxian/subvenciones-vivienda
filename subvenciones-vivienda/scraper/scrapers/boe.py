import requests
import xml.etree.ElementTree as ET
import hashlib
from datetime import datetime
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KEYWORDS = ['vivienda', 'rehabilitación', 'eficiencia energética', 'subvención',
            'ayuda', 'reforma', 'comunidad de propietarios', 'compra', 'alquiler',
            'Plan de Recuperación', 'Next Generation', 'IDAE', 'MITMA',
            'regeneración urbana', 'accesibilidad']

def _get_hash(titulo: str, fecha_publicacion: str) -> str:
    hash_str = f"{titulo}_{fecha_publicacion}".encode('utf-8')
    return hashlib.md5(hash_str).hexdigest()

def _detectar_tipo(titulo: str) -> str:
    t = titulo.lower()
    if any(k in t for k in ['placas', 'solar', 'caldera', 'aislamiento', 'certificado', 'eficiencia energética']):
        return 'eficiencia_energetica'
    if any(k in t for k in ['reforma', 'rehabilitación', 'obras', 'accesibilidad', 'regeneración urbana']):
        return 'reforma'
    if any(k in t for k in ['compra', 'adquisición', 'hipoteca', 'primera vivienda']):
        return 'compra'
    if any(k in t for k in ['alquiler', 'arrendamiento', 'bono alquiler']):
        return 'alquiler'
    if any(k in t for k in ['comunidad de propietarios', 'edificio', 'bloque']):
        return 'comunidad'
    return 'otros'

def _detectar_beneficiario(titulo: str) -> str:
    t = titulo.lower()
    if 'comunidad' in t or 'edificio' in t:
        return 'comunidad'
    if 'empresa' in t or 'profesional' in t:
        return 'empresa'
    return 'particular'

def scrape_boe() -> list:
    subvenciones = []
    today = datetime.now()
    fecha_str = today.strftime('%Y%m%d')
    url = f"https://boe.es/diario_boe/xml.php?id=BOE-S-{today.strftime('%Y-%m-%d')}"
    
    try:
        time.sleep(1) # respetando 1s de delay
        response = requests.get(url, timeout=10)
        
        # Fallback RSS
        if response.status_code != 200:
            logger.warning(f"Error fetching BOE XML: {response.status_code}. Using RSS fallback.")
            import feedparser
            rss_url = "https://www.boe.es/rss/boe.php"
            feed = feedparser.parse(rss_url)
            
            for entry in feed.entries:
                titulo = entry.title
                if any(kw.lower() in titulo.lower() for kw in KEYWORDS):
                    sub = {
                        "titulo": titulo,
                        "descripcion": entry.summary[:500] if 'summary' in entry else "",
                        "organismo": "BOE",
                        "ambito": "estatal",
                        "tipo": _detectar_tipo(titulo),
                        "beneficiario": _detectar_beneficiario(titulo),
                        "fecha_publicacion": today.strftime('%Y-%m-%d'),
                        "url_oficial": entry.link,
                        "hash_contenido": _get_hash(titulo, today.strftime('%Y-%m-%d'))
                    }
                    subvenciones.append(sub)
            return subvenciones

        root = ET.fromstring(response.content)
        
        for item in root.findall('.//item'):
            titulo_elem = item.find('titulo')
            if titulo_elem is None or not titulo_elem.text:
                continue
            
            titulo = titulo_elem.text
            
            if any(kw.lower() in titulo.lower() for kw in KEYWORDS):
                url_elem = item.find('urlXml')
                url_oficial = f"https://www.boe.es{url_elem.text}" if url_elem is not None else ""
                
                sub = {
                    "titulo": titulo,
                    "descripcion": titulo[:500], # BOE XML sometimes doesn't have a long summary in standard structure
                    "organismo": "BOE",
                    "ambito": "estatal",
                    "tipo": _detectar_tipo(titulo),
                    "beneficiario": _detectar_beneficiario(titulo),
                    "fecha_publicacion": today.strftime('%Y-%m-%d'),
                    "url_oficial": url_oficial,
                    "hash_contenido": _get_hash(titulo, today.strftime('%Y-%m-%d'))
                }
                subvenciones.append(sub)
                
    except Exception as e:
        logger.error(f"Error extrayendo BOE: {str(e)}")
        
    return subvenciones
