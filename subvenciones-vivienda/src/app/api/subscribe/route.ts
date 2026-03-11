import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, nombre, tipos_interes, ambito } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
        }

        // Insert or update
        const { data, error } = await supabase
            .from('suscriptores')
            .upsert({
                email,
                nombre: nombre || null,
                tipo_alerta: tipos_interes && tipos_interes.length > 0 ? tipos_interes : null,
                ambito_preferido: ambito,
                activo: true
            }, { onConflict: 'email' })
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: 'Error guardando en base de datos. Comprueba que las tablas existen.' }, { status: 500 });
        }

        // Send confirmation email
        try {
            if (process.env.RESEND_API_KEY) {
                await resend.emails.send({
                    from: 'Alertas Vivienda <onboarding@resend.dev>', // Update when having a valid domain
                    to: [email],
                    subject: '🏠 Confirmación: Alertas de Subvenciones de Vivienda activadas',
                    html: `
            <div style="font-family: sans-serif; p-8 text-center bg-gray-50 border border-gray-200">
              <h2 style="color: #2563eb">¡Suscripción confirmada!</h2>
              <p>Hola ${nombre || 'amigo'},</p>
              <p>A partir de ahora, monitorizaremos diariamente el BOE y los boletines oficiales por ti. 
                 Te enviaremos un correo solo cuando hayan nuevas ayudas que cumplan tus filtros.</p>
              <br/>
              <p><small>Para dejar de recibir alertas, haz clic <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/subscribe?action=unsubscribe&token=${data.token_baja}">aquí</a>.</small></p>
            </div>
          `
                });
            }
        } catch (emailErr) {
            console.error('Resend Error:', emailErr);
            // We don't fail the request if the email fails, as the user was saved in DB
        }

        return NextResponse.json({ success: true, message: '¡Suscripción activada! Te enviaremos un correo cuando haya nuevas ayudas.' });

    } catch (error) {
        console.error('Server error', error);
        return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl;
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    if (action === 'unsubscribe' && token) {
        const { error } = await supabase
            .from('suscriptores')
            .update({ activo: false })
            .eq('token_baja', token);

        if (error) {
            return NextResponse.json({ error: 'No se pudo procesar la baja. El enlace puede ser inválido.' }, { status: 400 });
        }

        // Simple HTML confirmation page for unsubscribe
        return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
           <h2 style="color: #166534;">Suscripción cancelada con éxito</h2>
           <p>Ya no recibirás más correos de nuestras alertas.</p>
           <a href="${process.env.NEXT_PUBLIC_SITE_URL || '/'}">Volver a la web</a>
        </body>
      </html>
    `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
}
