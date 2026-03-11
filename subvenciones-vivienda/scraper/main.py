import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers.boe import scrape_boe
from scrapers.xunta import scrape_dog
from scrapers.mitma import scrape_mitma

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_env():
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        logger.error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing")
        return None
    return create_client(url, key)

def guardar_subvenciones(supabase: Client, subvenciones: list) -> tuple:
    nuevas = 0
    duplicados = 0
    errores = 0

    if not supabase:
        logger.error("No Supabase client available.")
        return 0, 0, len(subvenciones)

    for sub in subvenciones:
        try:
            # Upsert using hash_contenido to avoid duplicates
            response = supabase.table('subvenciones').upsert(
                sub,
                on_conflict='hash_contenido'
            ).execute()
            nuevas += 1
        except Exception as e:
            if 'duplicate key value violates unique constraint' in str(e).lower() or '23505' in str(e):
                duplicados += 1
            else:
                logger.error(f"Error insertando: {sub.get('titulo')} - {str(e)}")
                errores += 1

    return nuevas, duplicados, errores

def main():
    logger.info("Iniciando scraper diario...")
    supabase = load_env()
    
    todas_subvenciones = []
    
    # 1. BOE
    logger.info("Scrapeando BOE...")
    boe_data = scrape_boe()
    todas_subvenciones.extend(boe_data)
    logger.info(f"BOE: {len(boe_data)} encontradas.")

    # 2. Xunta/DOG
    logger.info("Scrapeando DOG (Xunta)...")
    dog_data = scrape_dog()
    todas_subvenciones.extend(dog_data)
    logger.info(f"DOG: {len(dog_data)} encontradas.")

    # 3. MITMA
    logger.info("Scrapeando MITMA...")
    mitma_data = scrape_mitma()
    todas_subvenciones.extend(mitma_data)
    logger.info(f"MITMA: {len(mitma_data)} encontradas.")

    if supabase and todas_subvenciones:
        nuevas, duplicados, errores = guardar_subvenciones(supabase, todas_subvenciones)
        logger.info(f"--- RESUMEN ---")
        logger.info(f"Total procesadas: {len(todas_subvenciones)}")
        logger.info(f"Nuevas guardadas: {nuevas + duplicados} (Upserted)")
        logger.info(f"Errores: {errores}")
    else:
        logger.warning("No se pudo conectar a Supabase o no hay subvenciones para guardar.")

if __name__ == "__main__":
    main()
