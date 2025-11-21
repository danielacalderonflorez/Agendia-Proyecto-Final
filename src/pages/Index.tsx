import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MessageSquare, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-white font-['Poppins',sans-serif]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 mt-16 bg-[#f9fafb]">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-5 text-[#111827] leading-tight">
              Conecta con Profesionales, Agenda con Confianza
            </h1>
            <p className="text-lg text-[#4b5563] mb-8 leading-relaxed">
              Encuentra y agenda citas con los mejores profesionales en medicina, derecho, ingeniería, educación y contabilidad. Todo en un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[#374151] hover:bg-transparent hover:border hover:border-[#374151] hover:text-[#374151] text-white text-base px-6 py-3 rounded transition-all">
                <Link to="/profesionales">Explorar Profesionales</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-[#374151] hover:bg-transparent hover:border hover:border-[#374151] hover:text-[#374151] text-white text-base px-6 py-3 rounded border-none transition-all">
                <Link to="/auth">Registrarse Gratis</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={hero} alt="AgendaPro Logo" className="w-full max-w-md rounded-2xl shadow-lg" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-semibold text-[#111827] text-center mb-16">
          Encuentra al Profesional que Necesitas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-10 rounded-lg bg-white border border-[#e5e7eb] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#2563eb] transition-all">
            <div className="inline-flex items-center justify-center mb-5">
              <Calendar className="h-12 w-12 text-[#2563eb]" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#1f2937]">Agenda Fácil</h3>
            <p className="text-sm text-[#4b5563] leading-relaxed">
              Reserva citas en segundos con nuestro calendario inteligente
            </p>
          </div>
          <div className="text-center p-10 rounded-lg bg-white border border-[#e5e7eb] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#2563eb] transition-all">
            <div className="inline-flex items-center justify-center mb-5">
              <Clock className="h-12 w-12 text-[#2563eb]" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#1f2937]">Horarios Flexibles</h3>
            <p className="text-sm text-[#4b5563] leading-relaxed">
              Encuentra disponibilidad que se ajuste a tu rutina
            </p>
          </div>
          <div className="text-center p-10 rounded-lg bg-white border border-[#e5e7eb] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#2563eb] transition-all">
            <div className="inline-flex items-center justify-center mb-5">
              <MessageSquare className="h-12 w-12 text-[#2563eb]" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#1f2937]">Chat Integrado</h3>
            <p className="text-sm text-[#4b5563] leading-relaxed">
              Comunícate directamente con tu profesional
            </p>
          </div>
          <div className="text-center p-10 rounded-lg bg-white border border-[#e5e7eb] shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-[#2563eb] transition-all">
            <div className="inline-flex items-center justify-center mb-5">
              <Shield className="h-12 w-12 text-[#2563eb]" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#1f2937]">100% Seguro</h3>
            <p className="text-sm text-[#4b5563] leading-relaxed">
              Pagos protegidos y profesionales verificados
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 bg-[#f9fafb]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-semibold text-[#111827] mb-16">
            Agenda tu Cita en 3 Simples Pasos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center p-5">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2563eb] text-white text-3xl font-semibold rounded-full mb-5">
                1
              </div>
              <h6 className="text-xl font-medium text-[#1f2937]">Regístrate</h6>
            </div>
            <div className="text-center p-5">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2563eb] text-white text-3xl font-semibold rounded-full mb-5">
                2
              </div>
              <h6 className="text-xl font-medium text-[#1f2937]">Encuentra tu profesional</h6>
            </div>
            <div className="text-center p-5">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2563eb] text-white text-3xl font-semibold rounded-full mb-5">
                3
              </div>
              <h6 className="text-xl font-medium text-[#1f2937]">Agenda tu cita</h6>
            </div>
          </div>
          <div className="mt-12">
            <Button asChild size="lg" className="bg-[#374151] hover:bg-transparent hover:border hover:border-[#374151] hover:text-[#374151] text-white text-base px-8 py-3 rounded transition-all">
              <Link to="/auth">Crear Cuenta Gratis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1f2937] text-[#e5e7eb] py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto mb-10">
            <div>
              <img src={logo} alt="Logo" className="w-10 h-10 mb-4" />
              <p className="text-sm text-[#d1d5db] leading-relaxed">
                Conectando profesionales con quienes necesitan sus servicios. Tu confianza es nuestra prioridad.
              </p>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-5">Profesionales</h4>
              <ul className="space-y-3">
                <li><Link to="/profesionales" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Médicos</Link></li>
                <li><Link to="/profesionales" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Abogados</Link></li>
                <li><Link to="/profesionales" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Ingenieros</Link></li>
                <li><Link to="/profesionales" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Profesores</Link></li>
                <li><Link to="/profesionales" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Psicólogos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-5">Empresa</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Sobre Nosotros</Link></li>
                <li><Link to="/" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Cómo Funciona</Link></li>
                <li><Link to="/" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Términos y Condiciones</Link></li>
                <li><Link to="/" className="text-sm text-[#d1d5db] hover:text-[#2563eb] transition-colors">Política de Privacidad</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#374151] pt-5 text-center">
            <p className="text-sm text-[#9ca3af]">
              &copy; 2025 Profesionales. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;