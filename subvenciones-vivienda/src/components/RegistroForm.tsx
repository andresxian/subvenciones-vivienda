"use client";

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegistroForm() {
    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [tipos, setTipos] = useState<string[]>([]);
    const [ambito, setAmbito] = useState('ambos');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleTipoChange = (val: string) => {
        setTipos(prev =>
            prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, nombre, tipos_interes: tipos, ambito })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                setMessage(data.message || '¡Te has suscrito con éxito!');
                setEmail('');
                setNombre('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Ocurrió un error al procesar tu solicitud.');
            }
        } catch {
            setStatus('error');
            setMessage('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">¡Todo listo!</h2>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">{message}</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                >
                    Crear otra alerta
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            {status === 'error' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{message}</p>
                </div>
            )}

            {/* Datos Personales */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Datos Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico *</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre (Opcional)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej. Juan"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tipo de Ayuda */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Intereses (Opcional)</h3>
                <p className="text-sm text-slate-500 mb-4">Si no marcas ninguno, te avisaremos de todas las ayudas.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { id: 'eficiencia_energetica', label: 'Eficiencia Energética (Solar, aislamiento...)' },
                        { id: 'reforma', label: 'Reformas y Accesibilidad' },
                        { id: 'compra', label: 'Compra de primera vivienda' },
                        { id: 'alquiler', label: 'Ayudas al Alquiler' },
                        { id: 'comunidad', label: 'Comunidades de Propietarios' }
                    ].map((cat) => (
                        <label key={cat.id} className="flex items-start p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={tipos.includes(cat.id)}
                                onChange={() => handleTipoChange(cat.id)}
                            />
                            <span className="ml-3 text-sm text-slate-700 leading-tight">{cat.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Ámbito */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Preferencias Territoriales</h3>
                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="ambito" value="ambos" checked={ambito === 'ambos'} onChange={() => setAmbito('ambos')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-slate-700">Todas las de España + Autonómicas</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="ambito" value="estatal" checked={ambito === 'estatal'} onChange={() => setAmbito('estatal')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-slate-700">Solo ayudas Estatales (todo el territorio)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="ambito" value="galicia" checked={ambito === 'galicia'} onChange={() => setAmbito('galicia')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-slate-700">Comunidad Autónoma: Galicia (Ayudas de la Xunta)</span>
                    </label>
                </div>
            </div>

            <div className="pt-4 flex flex-col items-center">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                    {loading ? 'Procesando...' : 'Crear Alerta Gratuita'}
                    {!loading && <Send className="w-5 h-5" />}
                </button>
                <p className="mt-4 text-xs text-slate-500 text-center">
                    Al suscribirte aceptas nuestra <Link href="#" className="underline">política de privacidad</Link>. Solo recibirás alertas sobre vivienda, nunca spam.
                </p>
            </div>

        </form>
    );
}
