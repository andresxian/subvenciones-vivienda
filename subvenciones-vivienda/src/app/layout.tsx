import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Home, Bell, Search, Menu } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Subvenciones Vivienda España',
  description: 'Rastreador diario de subvenciones oficiales para vivienda, reformas y eficiencia energética en España. BOE, Comunidades Autónomas y MITMA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm transition-all duration-300">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">

                {/* Logo & Brand */}
                <div className="flex-shrink-0">
                  <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-md shadow-blue-600/20">
                      <Home className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                      Subvenciones<span className="text-slate-900">Vivienda</span>
                    </span>
                  </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-8">
                  <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                    Inicio
                  </Link>
                  <Link href="/subvenciones" className="flex items-center text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors gap-1.5">
                    <Search className="w-4 h-4" />
                    Buscar Ayudas
                  </Link>
                  <Link href="/registro" className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-all gap-1.5">
                    <Bell className="w-4 h-4" />
                    Recibir Alertas
                  </Link>
                </nav>

                {/* Mobile menu button */}
                <div className="md:hidden flex items-center">
                  <button className="text-slate-600 hover:text-slate-900 focus:outline-none p-2 rounded-md">
                    <Menu className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-white border-t border-slate-200 mt-20">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 opacity-80 mix-blend-multiply">
                  <Home className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-500 font-semibold text-lg tracking-tight">SubvencionesVivienda</span>
                </div>
                <p className="text-slate-500 text-sm text-center md:text-left shadow-sm">
                  Datos extraídos automáticamente del BOE y Diarios Oficiales autonómicos.
                  <br className="hidden md:block" /> Actualización diaria.
                </p>
                <div className="flex space-x-6">
                  <span className="text-slate-400 hover:text-slate-500 text-sm transition-colors cursor-pointer">Aviso Legal</span>
                  <span className="text-slate-400 hover:text-slate-500 text-sm transition-colors cursor-pointer">Privacidad</span>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-100 pt-8 flex items-center justify-center">
                <p className="text-sm text-slate-400">
                  &copy; {new Date().getFullYear()} Subvenciones Vivienda España. Sistema autónomo de rastreo.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
