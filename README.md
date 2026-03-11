# Subvenciones Vivienda (Next.js + Supabase + Resend)

Este proyecto es un rastreador autónomo de subvenciones de vivienda en España.

## Pasos restantes para el Usuario

El código ya está generado al completo. Sigue estos pasos para configurarlo y desplegarlo:

### 1. Variables de Entorno (Local y Vercel)
Crea un archivo \`.env.local\` en la carpeta \`subvenciones-vivienda\` (¡No lo subas a git!) e introduce lo siguiente:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key
RESEND_API_KEY=tu_api_key_de_resend
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
*(Cuando despliegues en Vercel, cambia NEXT_PUBLIC_SITE_URL por tu dominio en Vercel).*

### 2. Base de Datos (Supabase)
1. Ve a tu proyecto de Supabase.
2. Abre el **SQL Editor**.
3. Copia el contenido del archivo \`supabase_schema.sql\` que se generó en la carpeta raíz y ejecútalo para crear las tablas y las políticas de seguridad.

### 3. Automatización (GitHub Actions)
El scraper está configurado para correr automáticamente todos los días gratis en GitHub Actions.
1. Sube este proyecto entero (\`c:\\Users\\andre\\OneDrive\\Escritorio\\SUBVENCIONES VIVIENDA\`) a un repositorio en GitHub.
2. Ve a los **Settings** de tu repositorio en GitHub $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ **New repository secret**.
3. Crea los siguientes secretos:
   - \`SUPABASE_URL\` (La URL de tu proyecto de Supabase)
   - \`SUPABASE_SERVICE_KEY\` (Tu Service Role Key de Supabase)
   - \`RESEND_API_KEY\` (Tu API Key de Resend)
   - \`SITE_URL\` (La URL de tu web en Vercel, por ej. https://subvenciones.vercel.app)

### 4. Despliegue en Vercel (Frontend)
1. Entra a [Vercel](https://vercel.com) y enlaza el repositorio de GitHub que acabas de subir.
2. Asegúrate de añadir exactamente las mismas **Variables de entorno** que creaste localmente durante el proceso de importación en Vercel.
3. ¡Despliega el proyecto!

### Ejecución Local
Para probar la aplicación en tu ordenador:
```bash
cd subvenciones-vivienda
npm run dev
```

Para probar el scraper en tu ordenador:
```bash
# Crea un entorno virtual (opcional pero recomendado)
python -m venv venv
.\venv\Scripts\activate

# Instala dependencias del scraper
pip install -r scraper/requirements.txt

# Ejecuta el scraper (Asegúrate de tener un .env con SUPABASE_URL y SUPABASE_SERVICE_KEY)
python scraper/main.py
```
