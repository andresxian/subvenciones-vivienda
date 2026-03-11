import requests
from bs4 import BeautifulSoup
import hashlib
from datetime import datetime
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KEYWORDS = ['vivenda', 'vivienda', 'rehabilitación', 'eficiencia', 'reforma', 'subvención', 'axuda', 'ayuda', 'comunidade', 'enerxética']

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
        
        items = soup.find_all('li') # Placeholder for actual elements
        for item in items:
            titulo = item.text.strip()
            if any(kw.lower() in titulo.lower() for kw in KEYWORDS):
                link_elem = item.find('a')
                url_oficial = f"https://www.xunta.gal{link_elem['href']}" if link_elem and 'href' in link_elem.attrs else url
                
                sub = {
                    "titulo": titulo,
                    "descripcion": titulo[:500],
                    "organismo": "Xunta de Galicia (DOG)",
                    "ambito": "galicia",
                    "tipo": _detectar_tipo(titulo),
                    "beneficiario": _detectar_beneficiario(titulo),
                    "fecha_publicacion": today.strftime('%Y-%m-%d'),
                    "url_oficial": url_oficial,
                    "hash_contenido": _get_hash(titulo, today.strftime('%Y-%m-%d'))
                }
                subvenciones.append(sub)
                
    except Exception as e:
        logger.error(f"Error extrayendo DOG: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
    return subvenciones
