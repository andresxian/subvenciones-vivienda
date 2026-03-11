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
        'User-Agent': 'Mozilla/5.0 (compatible; SubvencionesBot/1.0)',
    }

    try:
        time.sleep(1.5)
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"Error fetching MITMA: {response.status_code}")
            return subvenciones

        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find cards or sections with aids
        # The structure is assumed, adjust as necessary if the real website differs
        cards = soup.select('.card, .ayuda-item, article') 
        
        for card in cards:
            title_elem = card.find(['h2', 'h3', 'h4'])
            if title_elem:
                titulo = title_elem.text.strip()
                desc_elem = card.find('p')
                descripcion = desc_elem.text.strip()[:500] if desc_elem else titulo
                
                link_elem = card.find('a')
                url_oficial = link_elem['href'] if link_elem and 'href' in link_elem.attrs else url
                if url_oficial.startswith('/'):
                    url_oficial = f"https://www.mivau.gob.es{url_oficial}"
                
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
