"use client";

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Filtros() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [tipo, setTipo] = useState(searchParams.get('tipo') || '');
    const [ambito, setAmbito] = useState(searchParams.get('ambito') || '');

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (tipo) params.set('tipo', tipo);
        if (ambito) params.set('ambito', ambito);

        router.push(`/subvenciones?${params.toString()}`);
    };

    const handleClear = () => {
        setQuery('');
        setTipo('');
        setAmbito('');
        router.push('/subvenciones');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">

                {/* Search input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="Buscar por palabras, como 'placas solares' o 'aislamiento'..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <select
                        className="block w-full pl-3 pr-10 py-3 text-base border-slate-300 border focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl appearance-none bg-slate-50"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <option value="">Cualquier tipo de ayuda</option>
                        <option value="eficiencia_energetica">Eficiencia Energética</option>
                        <option value="reforma">Reforma</option>
                        <option value="compra">Compra</option>
                        <option value="alquiler">Alquiler</option>
                        <option value="comunidad">Comunidad de Propietarios</option>
                    </select>

                    <select
                        className="block w-full pl-3 pr-10 py-3 text-base border-slate-300 border focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl appearance-none bg-slate-50"
                        value={ambito}
                        onChange={(e) => setAmbito(e.target.value)}
                    >
                        <option value="">Cualquier ámbito (Estatal y Autonómico)</option>
                        <option value="estatal">Estatal (BOE, MITMA)</option>
                        <option value="galicia">Galicia (DOG)</option>
                    </select>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Filtrar
                        </button>
                        {(query || tipo || ambito) && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
                                title="Limpiar filtros"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
