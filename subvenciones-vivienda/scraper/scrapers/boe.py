import requests
import xml.etree.ElementTree as ET
import hashlib
from datetime import datetime
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KEYWORDS = ['vivienda', 'rehabilitación de edificios', 'eficiencia energética en', 'reforma de vivienda', 'comunidad de propietarios', 'compra de vivienda', 'alquiler de vivienda', 'regeneración urbana', 'accesibilidad en vivienda', 'rehabilitación residencial', 'arrendamiento de vivienda', 'bono alquiler joven', 'plan estatal de vivienda', 'ayudas a la vivienda']

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

import re

def _clean_title(titulo: str) -> str:
    # Remove bureaucratic boilerplate
    prefixes = [
        r"(?i)^extracto de la resolución de \d+ de [a-z]+ de \d+[, ]*(de la|del)?\s*[^,]+,\s*por la que se convocan? (las)?\s*(ayudas|subvenciones)\s*",
        r"(?i)^extracto de la orden [^,]+,\s*por la que se aprueb[a-z]+(\s+por\s+tramitación\s+anticipada)?\s*la convocatoria de\s*(ayudas|subvenciones)\s*",
        r"(?i)^resolución de \d+ de [a-z]+ de \d+ [^,]+,\s*por la que se [a-z]+( \w+)* (ayudas|subvenciones) ",
        r"(?i)^extracto del acuerdo de \d+ de [a-z]+ de \d+ [^,]+,\s*por el que se aprueban las bases reguladoras de la concesión de subvención directa\s*"
    ]
    cleaned = titulo
    for prefix in prefixes:
        cleaned = re.sub(prefix, "", cleaned)
    
    # Capitalize first letter
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]
        
    return cleaned if len(cleaned) > 10 else titulo

def _extract_amount(text: str):
    matches = re.findall(r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:euros|€)', text, re.IGNORECASE)
    if matches:
        try:
            return float(matches[0].replace('.', '').replace(',', '.'))
        except:
            return None
    return None

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
                desc = entry.summary if 'summary' in entry else titulo
                clean_t = _clean_title(titulo)
                importe = _extract_amount(desc)
                
                # Try to extract deadline heuristically
                import datetime as dt
                fecha_fin_plazo = None
                if 'un plazo de' in desc.lower() or 'días hábiles' in desc.lower():
                    # Crude approximation: add 30 days if mentions a period
                    fecha_fin_plazo = (today + dt.timedelta(days=30)).strftime('%Y-%m-%d')
                
                sub = {
                    "titulo": clean_t,
                    "descripcion": desc[:500] + ('...' if len(desc) > 500 else ''),
                    "organismo": "BOE",
                    "ambito": "estatal",
                    "tipo": _detectar_tipo(titulo),
                    "beneficiario": _detectar_beneficiario(titulo),
                    "importe_max": importe,
                    "fecha_publicacion": today.strftime('%Y-%m-%d'),
                    "fecha_fin_plazo": fecha_fin_plazo,
                    "url_oficial": entry.link,
                    "hash_contenido": _get_hash(titulo, today.strftime('%Y-%m-%d'))
                }
                subvenciones.append(sub)
                
    except Exception as e:
        logger.error(f"Error extrayendo BOE: {str(e)}")
        
    return subvenciones
