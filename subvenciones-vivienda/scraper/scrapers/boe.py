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
    url = "https://www.boe.es/rss/canal.php?c=ayudas"
    
    try:
        import feedparser
        time.sleep(1)
        feed = feedparser.parse(url)
        
        for entry in feed.entries:
            titulo = entry.title
            
            # Since this feed is ALL grants, we only extract the housing-related ones.
            if any(kw.lower() in titulo.lower() for kw in KEYWORDS):
                sub = {
                    "titulo": titulo,
                    "descripcion": entry.summary[:500] if 'summary' in entry else titulo[:500],
                    "organismo": "BOE",
                    "ambito": "estatal",
                    "tipo": _detectar_tipo(titulo),
                    "beneficiario": _detectar_beneficiario(titulo),
                    "fecha_publicacion": today.strftime('%Y-%m-%d'),
                    "url_oficial": entry.link,
                    "hash_contenido": _get_hash(titulo, today.strftime('%Y-%m-%d'))
                }
                subvenciones.append(sub)
                
    except Exception as e:
        logger.error(f"Error extrayendo BOE: {str(e)}")
        
    return subvenciones
