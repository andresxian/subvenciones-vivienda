import requests
from bs4 import BeautifulSoup
import hashlib
from datetime import datetime
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KEYWORDS = [
    'vivenda', 'vivienda', 'igvs', 'instituto galego da vivenda', 
    'rehabilitación', 'rehabilitacion', 'eficiencia enerxética', 
    'eficiencia energética', 'reforma', 'comunidade de propietarios', 
    'comunidad de propietarios', 'compra', 'adquisición', 
    'aluguer', 'alquiler', 'accesibilidade', 'accesibilidad', 
    'bono alugueiro', 'bono alquiler', 'plan estatal', 'mellora', 'mejora', 
    'conservación', 'conservacion', 'alojamiento', 'aloxamento'
]

GRANT_KEYWORDS = ['axuda', 'ayuda', 'subvención', 'subvencion', 'bono', 'programa', 'bases reguladoras', 'convocatoria']

def _get_hash(titulo: str, fecha_publicacion: str) -> str:
    hash_str = f"{titulo}_{fecha_publicacion}".encode('utf-8')
    return hashlib.md5(hash_str).hexdigest()

def _detectar_tipo(titulo: str) -> str:
    t = titulo.lower()
    if any(k in t for k in ['placas', 'solar', 'caldeira', 'illamento', 'certificado', 'eficiencia enerxética', 'eficiencia']):
        return 'eficiencia_energetica'
    if any(k in t for k in ['reforma', 'rehabilitación', 'obras', 'accesibilidade']):
        return 'reforma'
    if any(k in t for k in ['compra', 'adquisición', 'hipoteca', 'primera vivienda', 'primeira vivenda']):
        return 'compra'
    if any(k in t for k in ['alquiler', 'aluguer', 'arrendamento', 'bono']):
        return 'alquiler'
    if any(k in t for k in ['comunidad de propietarios', 'comunidade de propietarios', 'edificio', 'bloque']):
        return 'comunidad'
    return 'otros'

def _detectar_beneficiario(titulo: str) -> str:
    t = titulo.lower()
    if 'comunidad' in t or 'edificio' in t or 'comunidade' in t:
        return 'comunidad'
    if 'empresa' in t or 'profesional' in t or 'autónomo' in t:
        return 'empresa'
    return 'particular'
    
import re
def _clean_title(titulo: str) -> str:
    prefixes = [
        r"(?i)^resolución do \d+ de [a-z]+ de \d+ [^,]+,\s*pola que se [a-z]+( \w+)* as bases reguladoras para a concesión de (subvencións|axudas)\s*",
        r"(?i)^orde do \d+ de [a-z]+ de \d+ [^,]+,\s*pola que se establecen as bases reguladoras aplicables á concesión de (as )?(axudas|subvencións)\s*"
    ]
    cleaned = titulo
    for prefix in prefixes:
        cleaned = re.sub(prefix, "", cleaned)
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned if len(cleaned) > 10 else titulo

def _extract_amount(text: str):
    matches = re.findall(r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:euros|€)', text, re.IGNORECASE)
    if matches:
        try:
            return float(matches[0].replace('.', '').replace(',', '.'))
        except:
            pass
    return None

def scrape_dog() -> list:
    subvenciones = []
    today = datetime.now()
    # Usar el RSS general del DOG que contiene todas las publicaciones del día
    url = "https://www.xunta.gal/diario-oficial-galicia/rss/Sumario_gl.rss"
    
    try:
        import feedparser
        time.sleep(2)
        feed = feedparser.parse(url)
        
        seen_titles = set()
        
        for entry in feed.entries:
            titulo = entry.title.strip()
            if not titulo or len(titulo) < 15 or titulo in seen_titles: continue
            
            # Buscar en el título y en el organismo que suele venir en la descripción
            desc = entry.description if 'description' in entry else ""
            full_text = (titulo + " " + desc).lower()
            
            # 1. Comprobar que es de vivienda/rehabilitacion
            is_housing = any(kw in full_text for kw in KEYWORDS)
            
            # 2. Comprobar que es una subvencion/ayuda (anuncios de IGVS no siempre son ayudas)
            is_grant = any(kw in titulo.lower() for kw in GRANT_KEYWORDS)
            
            # Bonus: Si el titulo es muy explicito sobre ser una ayuda IGVS
            is_igvs_grant = 'instituto galego da vivenda' in desc.lower() and ('resolución' in titulo.lower() or 'convocan' in titulo.lower() or 'axuda' in titulo.lower())

            if (is_housing and is_grant) or is_igvs_grant:
                seen_titles.add(titulo)
                url_oficial = entry.link if 'link' in entry else f"https://www.xunta.gal{entry.id}"
                
                clean_t = _clean_title(titulo)
                importe = _extract_amount(titulo)
                
                import datetime as dt
                fecha_fin_plazo = None
                if 'prazo de' in full_text or 'días hábiles' in full_text or 'meses' in full_text:
                    fecha_fin_plazo = (today + dt.timedelta(days=30)).strftime('%Y-%m-%d')
                
                sub = {
                    "titulo": clean_t,
                    "descripcion": titulo[:500],
                    "organismo": "Xunta de Galicia (DOG) - IGVS",
                    "ambito": "galicia",
                    "tipo": _detectar_tipo(titulo),
                    "beneficiario": _detectar_beneficiario(titulo),
                    "importe_max": importe,
                    "fecha_publicacion": today.strftime('%Y-%m-%d'),
                    "fecha_fin_plazo": fecha_fin_plazo,
                    "url_oficial": url_oficial,
                    "hash_contenido": _get_hash(titulo, today.strftime('%Y-%m-%d'))
                }
                subvenciones.append(sub)
                
    except Exception as e:
        logger.error(f"Error extrayendo DOG: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
    return subvenciones
