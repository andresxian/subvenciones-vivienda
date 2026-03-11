import requests
from bs4 import BeautifulSoup
import hashlib
from datetime import datetime
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _get_hash(titulo: str, fecha_publicacion: str) -> str:
    hash_str = f"{titulo}_{fecha_publicacion}".encode('utf-8')
    return hashlib.md5(hash_str).hexdigest()

def scrape_mitma() -> list:
    subvenciones = []
    today = datetime.now()
    url = "https://www.mivau.gob.es/vivienda/ayudas"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }

    try:
        time.sleep(1.5)
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"Error fetching MITMA: {response.status_code}")
            return subvenciones

        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Universal fallback: search all links
        links = soup.find_all('a')
        seen_titles = set()
        
        KEYWORDS = ['vivienda', 'rehabilitación', 'eficiencia', 'alquiler', 'adquisición', 'compra', 'accesibilidad', 'bono']
        
        for link in links:
            titulo = link.text.strip()
            # Only process links that represent an article/grant title (long enough, contains keywords)
            if len(titulo) > 20 and titulo not in seen_titles and any(kw.lower() in titulo.lower() for kw in KEYWORDS):
                seen_titles.add(titulo)
                href = link.get('href', '')
                if not href or href.startswith('javascript:'):
                    continue
                    
                url_oficial = f"https://www.mivau.gob.es{href}" if href.startswith('/') else href
                descripcion = titulo[:500]
                
                # Determine type heuristically from the title
                t = titulo.lower()
                tipo = 'otros'
                if 'reforma' in t or 'rehabilitación' in t: tipo = 'reforma'
                elif 'alquiler' in t: tipo = 'alquiler'
                elif 'compra' in t: tipo = 'compra'
                elif 'eficiencia' in t: tipo = 'eficiencia_energetica'
                
                sub = {
                    "titulo": titulo,
                    "descripcion": descripcion,
                    "organismo": "MITMA",
                    "ambito": "estatal",
                    "tipo": tipo,
                    "beneficiario": "particular", # Default for now
                    "fecha_publicacion": today.strftime('%Y-%m-%d'),
                    "url_oficial": url_oficial,
                    "hash_contenido": _get_hash(titulo, today.strftime('%Y-%m-%d'))
                }
                subvenciones.append(sub)
                
    except Exception as e:
        logger.error(f"Error extrayendo MITMA: {str(e)}")
        
    return subvenciones
