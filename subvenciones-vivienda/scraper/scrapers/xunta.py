import requests
from bs4 import BeautifulSoup
import hashlib
from datetime import datetime
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KEYWORDS = ['vivenda', 'vivienda', 'rehabilitación de edificios', 'eficiencia enerxética', 'eficiencia energética en', 'reforma de vivenda', 'reforma de vivienda', 'comunidade de propietarios', 'comunidad de propietarios', 'compra de vivenda', 'compra de vivienda', 'aluguer', 'alquiler de vivienda', 'accesibilidade en vivenda', 'accesibilidad en vivienda', 'bono alugueiro xove', 'bono alquiler joven', 'plan estatal']

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
    url = "https://www.xunta.gal/dog/Publicados"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; SubvencionesBot/1.0)',
        'Accept-Language': 'es-ES,es;q=0.9,gl;q=0.8'
    }

    try:
        time.sleep(2) # Respetar rate limiting
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"Error fetching DOG: {response.status_code}")
            return subvenciones

        soup = BeautifulSoup(response.content, 'html.parser')
        
        # This is a very basic structure assuming a specific DOG HTML structure.
        # It needs to be adapted based on the actual live site's DOM.
        
        items = soup.find_all('a') 
        seen_titles = set()
        
        for item in items:
            href = item.get('href', '')
            if '/dog/Publicados/' in href:
                titulo = item.text.strip()
                if not titulo or len(titulo) < 15 or titulo in seen_titles: continue
                seen_titles.add(titulo)
                
                if any(kw.lower() in titulo.lower() for kw in KEYWORDS):
                    url_oficial = f"https://www.xunta.gal{href}" if href.startswith('/') else href
                    clean_t = _clean_title(titulo)
                    importe = _extract_amount(titulo)
                    
                    import datetime as dt
                    fecha_fin_plazo = None
                    if 'prazo de' in titulo.lower() or 'días hábiles' in titulo.lower():
                        fecha_fin_plazo = (today + dt.timedelta(days=30)).strftime('%Y-%m-%d')
                    
                    sub = {
                        "titulo": clean_t,
                        "descripcion": titulo[:500],
                        "organismo": "Xunta de Galicia (DOG)",
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
