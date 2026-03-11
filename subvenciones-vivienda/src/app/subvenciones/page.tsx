import { supabase } from '@/lib/supabase';
import SubvencionCard, { SubvencionType } from '@/components/SubvencionCard';
import Filtros from '@/components/Filtros';

export const revalidate = 0; // ISR disabled for fresh data

export default async function SubvencionesPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined }
}) {
    const query = searchParams.q || '';
    const tipo = searchParams.tipo || '';
    const ambito = searchParams.ambito || '';
    const limit = 20;

    let dbQuery = supabase.from('subvenciones').select('*').eq('activa', true);

    if (query) {
        dbQuery = dbQuery.ilike('titulo', `%${query}%`);
    }
    if (tipo) {
        dbQuery = dbQuery.eq('tipo', tipo);
    }
    if (ambito) {
        dbQuery = dbQuery.eq('ambito', ambito);
    }

    // Ordenar de más a menos reciente
    dbQuery = dbQuery.order('fecha_publicacion', { ascending: false }).limit(limit);

    const { data, error } = await dbQuery;
    const subvenciones: SubvencionType[] = data || [];

    return (
        <div className="min-h-screen bg-slate-50 pt-8 pb-20">
            <div className="container max-w-7xl mx-auto px-4">

                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Encuentra tu ayuda ideal
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Utiliza los filtros para buscar subvenciones de eficiencia energética, reformas, instalación de ascensores y más.
                    </p>
                </div>

                {/* Componente Cliente para filtros */}
                <Filtros />

                {/* Resultados */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">
                            {subvenciones.length} {subvenciones.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                        </h2>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                            Ha ocurrido un error cargando las subvenciones.
                        </div>
                    )}

                    {subvenciones.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subvenciones.map((subvencion) => (
                                <SubvencionCard key={subvencion.id} subvencion={subvencion} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                            <span className="text-4xl mb-4">🔍</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No hemos encontrado resultados</h3>
                            <p className="text-slate-500 max-w-md">Prueba a usar términos más generales o cambiar los filtros. El sistema de alertas te puede avisar cuando salga una nueva.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
