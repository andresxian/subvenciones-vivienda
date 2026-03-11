import Link from 'next/link';
import { ExternalLink, Calendar, Landmark, Users, Clock } from 'lucide-react';

export type SubvencionType = {
    id: string;
    titulo: string;
    descripcion: string;
    organismo: string;
    ambito: string;
    tipo: string;
    beneficiario?: string;
    importe_max?: number | null;
    fecha_publicacion: string;
    fecha_fin_plazo?: string | null;
    url_oficial: string;
    activa: boolean;
};

interface Props {
    subvencion: SubvencionType;
}

const tipoColors: Record<string, string> = {
    eficiencia_energetica: 'bg-green-100 text-green-700 border-green-200',
    reforma: 'bg-orange-100 text-orange-700 border-orange-200',
    compra: 'bg-blue-100 text-blue-700 border-blue-200',
    alquiler: 'bg-purple-100 text-purple-700 border-purple-200',
    comunidad: 'bg-slate-100 text-slate-700 border-slate-200',
    otros: 'bg-gray-100 text-gray-700 border-gray-200'
};

const tipoLabels: Record<string, string> = {
    eficiencia_energetica: 'Eficiencia Energética',
    reforma: 'Reforma y Rehab.',
    compra: 'Compra vivienda',
    alquiler: 'Alquiler',
    comunidad: 'Comunidad Propietarios',
    otros: 'Otras ayudas'
};

export default function SubvencionCard({ subvencion }: Props) {
    const badgeClass = tipoColors[subvencion.tipo] || tipoColors['otros'];
    const label = tipoLabels[subvencion.tipo] || 'Otras ayudas';

    // Format dates
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'Sin fecha límite';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col h-full group">

            {/* Target & Badge Row */}
            <div className="flex justify-between items-start mb-4 gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
                    {label}
                </span>
                {subvencion.importe_max && (
                    <span className="inline-flex items-center text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        Hasta {subvencion.importe_max.toLocaleString('es-ES')}€
                    </span>
                )}
            </div>

            {/* Title & Description */}
            <div className="flex-grow">
                <Link href={`/subvenciones/${subvencion.id}`} className="block">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {subvencion.titulo}
                    </h3>
                </Link>
                <p className="text-sm text-slate-500 mb-6 line-clamp-3">
                    {subvencion.descripcion}
                </p>
            </div>

            {/* Meta Footer */}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate" title={subvencion.organismo}>{subvencion.organismo}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="capitalize truncate" title={subvencion.beneficiario || 'Todos'}>
                            Req: {subvencion.beneficiario || 'Todos'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate" title={`Publicado: ${formatDate(subvencion.fecha_publicacion)}`}>
                            Pub: {formatDate(subvencion.fecha_publicacion)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        <span className="font-medium text-orange-700 truncate" title={`Fin: ${subvencion.fecha_fin_plazo ? formatDate(subvencion.fecha_fin_plazo) : 'Sin límite'}`}>
                            Fin: {subvencion.fecha_fin_plazo ? formatDate(subvencion.fecha_fin_plazo) : 'Sin límite'}
                        </span>
                    </div>
                </div>

                <Link
                    href={`/subvenciones/${subvencion.id}`}
                    className="mt-2 flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all duration-300 gap-2 border border-blue-100 hover:border-transparent"
                >
                    Ver detalles completos
                </Link>
            </div>

        </div>
    );
}
