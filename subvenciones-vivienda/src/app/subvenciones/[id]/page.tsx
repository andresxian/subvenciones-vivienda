import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Calendar, Landmark, Users, Clock, Euro, CheckCircle2 } from 'lucide-react';

export const revalidate = 0; // Disable cache so the user sees real-time data always

export default async function SubvencionDetail({ params }: { params: { id: string } }) {
    const { data: subvencion, error } = await supabase
        .from('subvenciones')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !subvencion) {
        notFound();
    }

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'Sin fecha límite especificada';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const isExpiringSoon = subvencion.fecha_fin_plazo ? new Date(subvencion.fecha_fin_plazo) < new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000) : false;

    return (
        <div className="min-h-[80vh] bg-slate-50 py-12">
            <div className="container max-w-4xl mx-auto px-4">
                <Link href="/subvenciones" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Volver al listado
                </Link>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-12 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Landmark className="w-48 h-48" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/30">
                                    {subvencion.tipo}
                                </span>
                                {subvencion.importe_max && (
                                    <span className="inline-flex items-center px-3 py-1 bg-green-400/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-green-100 border border-green-400/30">
                                        <Euro className="w-3 h-3 mr-1" /> Hasta {subvencion.importe_max.toLocaleString('es-ES')}€
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
                                {subvencion.titulo}
                            </h1>
                            <p className="text-blue-100 text-lg flex items-center gap-2">
                                <Landmark className="w-5 h-5" /> Convocado por: {subvencion.organismo} ({subvencion.ambito})
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                        <div className="p-6 flex flex-col items-center text-center">
                            <Users className="w-6 h-6 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Destinatarios</span>
                            <span className="font-semibold text-slate-900 capitalize">{subvencion.beneficiario || 'Cualquier perfil'}</span>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center">
                            <Calendar className="w-6 h-6 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fecha Publicación</span>
                            <span className="font-semibold text-slate-900">{formatDate(subvencion.fecha_publicacion)}</span>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center col-span-2 md:col-span-2 bg-orange-50/30">
                            <Clock className={`w-6 h-6 mb-2 ${isExpiringSoon ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
                            <span className="text-xs text-orange-600/80 uppercase font-bold tracking-wider mb-1">Fin de plazo estimado</span>
                            <span className={`font-bold ${isExpiringSoon ? 'text-red-600' : 'text-orange-700'}`}>
                                {formatDate(subvencion.fecha_fin_plazo)}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-500" />
                            Resumen de la Ayuda
                        </h2>

                        <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed mb-12">
                            {subvencion.descripcion.split('\n').map((paragraph: string, i: number) => (
                                <p key={i}>{paragraph}</p>
                            ))}
                        </div>

                        {/* Action Box */}
                        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="font-bold text-blue-900 text-lg mb-1">¿Te interesa esta subvención?</h3>
                                <p className="text-blue-700/80 text-sm">Visita la sede electrónica oficial para descargar las bases, comprobar requisitos exactos y presentar tu solicitud.</p>
                            </div>
                            <Link
                                href={subvencion.url_oficial}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5"
                            >
                                Ir a la fuente oficial <ExternalLink className="w-5 h-5 ml-2" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Dummy icon to avoid errors
function FileText({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>;
}
