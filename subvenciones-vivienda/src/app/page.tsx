import Link from 'next/link';
import { Search, Bell, Activity, Users, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SubvencionCard, { SubvencionType } from '@/components/SubvencionCard';

export const revalidate = 0; // ISR disabled for fresh data

async function getStats() {
  const { count: totalActivas } = await supabase
    .from('subvenciones')
    .select('*', { count: 'exact', head: true })
    .eq('activa', true);

  const todayStr = new Date().toISOString().split('T')[0];
  const { count: nuevasHoy } = await supabase
    .from('subvenciones')
    .select('*', { count: 'exact', head: true })
    .eq('fecha_publicacion', todayStr);

  const { count: suscriptores } = await supabase
    .from('suscriptores')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true);

  return { totalActivas, nuevasHoy, suscriptores };
}

async function getLatestSubvenciones() {
  const { data } = await supabase
    .from('subvenciones')
    .select('*')
    .eq('activa', true)
    .order('fecha_publicacion', { ascending: false })
    .limit(6);
  return data as SubvencionType[] | null;
}

export default async function Home() {
  const stats = await getStats();
  const latest = await getLatestSubvenciones();

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-blue-50/50">
          <div className="absolute rounded-full w-[800px] h-[800px] bg-blue-100/50 blur-3xl -top-48 -right-48 animate-pulse opacity-50"></div>
          <div className="absolute rounded-full w-[600px] h-[600px] bg-indigo-100/40 blur-3xl bottom-0 -left-20 animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6 border border-blue-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Rastreador Automático Diario
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Todas las <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">ayudas de vivienda</span> en un solo lugar
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Monitorizamos diariamente el BOE, Ministerios y Comunidades Autónomas para que no pierdas ninguna subvención de reforma, compra o eficiencia energética.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/subvenciones" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 gap-2 group">
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Explorar Subvenciones
            </Link>
            <Link href="/registro" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-lg border-2 border-slate-200 hover:border-blue-200 transition-all gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Crear Alerta Email
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container max-w-7xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-4xl font-extrabold text-slate-900 mb-1">{stats.totalActivas || 0}</p>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ayudas Activas</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-green-600">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-4xl font-extrabold text-slate-900 mb-1">{stats.nuevasHoy || 0}</p>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Nuevas Hoy</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-4xl font-extrabold text-slate-900 mb-1">{stats.suscriptores || 0}</p>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Usuarios Alertados</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ayudas por categoría</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Selecciona el tipo de ayuda que necesitas para encontrar las convocatorias que mejor se adaptan a tu perfil.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['Eficiencia Energética', 'Reforma', 'Compra', 'Alquiler', 'Comunidades'].map((cat) => (
            <Link key={cat} href={`/subvenciones?tipo=${cat.toLowerCase().split(' ')[0]}`} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-full bg-slate-50 mb-3 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <span className="text-xl">🏠</span>
              </div>
              <span className="font-semibold text-sm text-slate-700 group-hover:text-blue-700">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Subvenciones */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Últimas Convocatorias</h2>
              <p className="text-slate-600">Las ayudas más recientes detectadas por nuestro sistema.</p>
            </div>
            <Link href="/subvenciones" className="hidden sm:flex items-center text-blue-600 font-semibold hover:text-blue-700 gap-1">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {latest && latest.length > 0 ? (
              latest.map(sub => (
                <SubvencionCard key={sub.id} subvencion={sub} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500">No hay subvenciones recientes. El scraper se está ejecutando.</p>
              </div>
            )}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/subvenciones" className="inline-flex items-center justify-center w-full px-6 py-3 border border-slate-300 rounded-full font-medium text-slate-700 bg-white hover:bg-slate-50">
              Ver todas las ayudas
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Newsletter */}
      <section className="container max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 shadow-2xl text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <Bell className="w-10 h-10 mx-auto text-blue-200 mb-4" />
            <h2 className="text-3xl font-bold mb-4">No te pierdas ninguna ayuda oficial</h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">Nuestro sistema rastrea el BOE y los diarios autonómicos cada mañana. Te avisamos por email solo cuando haya alguna ayuda que encaje con tu perfil.</p>
            <Link href="/registro" className="inline-block bg-white text-blue-700 font-bold px-8 py-4 rounded-full hover:bg-slate-50 hover:scale-105 transition-all shadow-lg">
              Configurar mi alerta gratis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
