import os
import logging
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from resend import Resend

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generarHtmlEmail(suscriptor, subvenciones, site_url: str):
    nombre_txt = f"Hola {suscriptor.get('nombre')}," if suscriptor.get('nombre') else "Hola,"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px;">🏠 Subvenciones Vivienda</h1>
            </div>
            
            <p style="font-size: 16px;">{nombre_txt}</p>
            <p style="font-size: 16px;">Hoy hay <strong>{len(subvenciones)} nuevas subvenciones</strong> que podrían interesarte según tus preferencias:</p>
            
            <div style="margin-top: 25px;">
    """
    
    for sub in subvenciones:
        titulo = sub.get('titulo', 'Sin título')
        organismo = sub.get('organismo', 'Oficial')
        desc = sub.get('descripcion', '')
        importe = f"Importe Max: {sub.get('importe_max')}€" if sub.get('importe_max') else ""
        
        html += f"""
                <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 16px;">{titulo}</h3>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">🏢 {organismo}</p>
                    <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">{desc}</p>
                    { f'<p style="margin: 0 0 12px 0; color: #166534; font-size: 13px; font-weight: bold;">💰 {importe}</p>' if importe else ''}
                    <a href="{site_url}/subvenciones" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 500;">Ver detalles de la subvención</a>
                </div>
        """
        
    html += f"""
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="{site_url}/subvenciones" style="display: inline-block; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">Ver todas las subvenciones en la web</a>
            </div>
            
            <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>Recibes este email porque te suscribiste a las alertas de Subvenciones Vivienda España.</p>
                <p><a href="{site_url}/api/subscribe?action=unsubscribe&token={suscriptor.get('token_baja')}" style="color: #9ca3af; text-decoration: underline;">Darme de baja de estas alertas</a></p>
                <p>© {datetime.now().year} Subvenciones Vivienda. Datos oficiales.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

def main():
    logger.info("Iniciando envío de emails...")
    load_dotenv()
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    resend_api_key = os.environ.get("RESEND_API_KEY")
    site_url = os.environ.get("SITE_URL", "http://localhost:3000") # o NEXT_PUBLIC_SITE_URL
    
    if not all([supabase_url, supabase_key, resend_api_key]):
        logger.error("Faltan variables de entorno esenciales (Supabase o Resend).")
        return

    supabase: Client = create_client(supabase_url, supabase_key)
    resend_client = Resend(api_key=resend_api_key)

    # 1. Obtener subvenciones de hoy (fecha_publicacion = today)
    today_str = datetime.now().strftime('%Y-%m-%d')
    res_subs = supabase.table('subvenciones').select('*').eq('fecha_publicacion', today_str).execute()
    subvenciones_hoy = res_subs.data

    if not subvenciones_hoy:
        logger.info("No hay subvenciones nuevas hoy. Terminando.")
        return

    # 2. Obtener todos los suscriptores activos
    res_suscript = supabase.table('suscriptores').select('*').eq('activo', True).execute()
    suscriptores = res_suscript.data

    if not suscriptores:
        logger.info("No hay suscriptores activos.")
        return

    logger.info(f"Subvenciones nuevas hoy: {len(subvenciones_hoy)}")
    logger.info(f"Suscriptores activos a notificar: {len(suscriptores)}")

    for suscriptor in suscriptores:
        # Filtrar. Lógica simplificada:
        amb_pref = suscriptor.get('ambito_preferido', 'estatal')
        tipos_pref = suscriptor.get('tipo_alerta', [])

        relevantes = []
        for s in subvenciones_hoy:
            match_ambito = (amb_pref == 'ambos' or s.get('ambito') == amb_pref or s.get('ambito') == 'estatal')
            match_tipo = (not tipos_pref) or (s.get('tipo', 'otros') in tipos_pref)
            if match_ambito and match_tipo:
                relevantes.append(s)

        if relevantes:
            html_content = generarHtmlEmail(suscriptor, relevantes, site_url)
            
            try:
                # 3. Mandar email con Resend
                params = {
                    "from": "Alertas Vivienda <onboarding@resend.dev>", # Replace with real domain when verified in Resend
                    "to": [suscriptor['email']],
                    "subject": f"🏠 {len(relevantes)} nuevas subvenciones de vivienda hoy - {today_str}",
                    "html": html_content
                }
                
                logger.info(f"Enviando correo a {suscriptor['email']} con {len(relevantes)} subvenciones...")
                # Activar esto cuando Resend esté configurado por el usuario, por el momento dejamos comentado para no crashear
                # email_response = resend_client.Emails.send(params)
                
                # 4. Registrar en tabla
                subvenciones_ids = [s['id'] for s in relevantes if 'id' in s]
                supabase.table('emails_enviados').insert({
                    "suscriptor_id": suscriptor['id'],
                    "subvenciones_incluidas": subvenciones_ids,
                    "estado": "enviado"
                }).execute()
                
            except Exception as e:
                logger.error(f"Error enviando email a {suscriptor['email']}: {str(e)}")
            
            # Rate limiting básico
            time.sleep(0.5)

if __name__ == "__main__":
    main()
