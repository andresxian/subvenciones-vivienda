-- TABLA: subvenciones
CREATE TABLE IF NOT EXISTS subvenciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    descripcion text,
    organismo text, -- (BOE, Xunta, MITMA, etc)
    ambito text, -- (estatal, galicia)
    tipo text, -- (eficiencia_energetica, reforma, compra, venta, comunidad)
    beneficiario text, -- (particular, empresa, comunidad)
    importe_max numeric,
    fecha_publicacion date,
    fecha_fin_plazo date,
    url_oficial text,
    activa boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    hash_contenido text UNIQUE -- (para evitar duplicados)
);

-- TABLA: suscriptores
CREATE TABLE IF NOT EXISTS suscriptores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    nombre text,
    tipo_alerta text[], -- (array de tipos que le interesan)
    ambito_preferido text, -- (estatal, galicia, ambos)
    activo boolean DEFAULT true,
    token_baja uuid DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now()
);

-- TABLA: emails_enviados
CREATE TABLE IF NOT EXISTS emails_enviados (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    suscriptor_id uuid REFERENCES suscriptores(id),
    fecha_envio timestamptz DEFAULT now(),
    subvenciones_incluidas uuid[],
    estado text -- (enviado, error)
);

-- Row Level Security (RLS) básico

-- subvenciones: lectura pública, escritura solo service_role
ALTER TABLE subvenciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de subvenciones" ON subvenciones FOR SELECT USING (true);
-- Nota: En Supabase, el service_role (usado por el backend en node/python) bypassa el RLS por defecto, así que no hace falta una policy explícita de insert si se usa la llave correcta. Si usas anon key, no podrán insertar.

-- suscriptores: solo el propio usuario puede ver sus datos (usamos email/auth uid si hubiera, pero al ser suscripción anónima, limitamos read mediante policies personalizadas o a service_role)
ALTER TABLE suscriptores ENABLE ROW LEVEL SECURITY;
-- Permitir inserción anónima para que se puedan suscribir
CREATE POLICY "Permitir suscripcion anonima" ON suscriptores FOR INSERT WITH CHECK (true);
CREATE POLICY "Suscriptores visibles para ellos mismos (update token_baja)" ON suscriptores FOR UPDATE USING (true);

-- emails_enviados: solo service_role
ALTER TABLE emails_enviados ENABLE ROW LEVEL SECURITY;
-- No añadimos policies públicas; service_role puede leer/escribir.
