import RegistroForm from '@/components/RegistroForm';

export default function RegistroPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-16">
            <div className="container max-w-3xl mx-auto px-4">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Recibe alertas en tu correo
                    </h1>
                    <p className="text-lg text-slate-600">
                        Te enviaremos un email únicamente cuando se publiquen subvenciones nuevas que encajen con lo que buscas.
                    </p>
                </div>

                <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl p-6 md:p-10">
                    <RegistroForm />
                </div>
            </div>
        </div>
    );
}
