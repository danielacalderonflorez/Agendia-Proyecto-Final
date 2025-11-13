import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MessageSquare, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import logo from "@/assets/logo.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <img src={logo} alt="AgendaPro Logo" className="h-32 w-32 object-contain" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Agenda Citas con Profesionales
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Conecta con los mejores profesionales en minutos. Reserva, paga y gestiona tus citas de forma simple y segura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow text-lg px-8">
              <Link to="/profesionales">Explorar Profesionales</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/registro">Registrarse Gratis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">¿Por qué AgendaPro?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Agenda Fácil</h3>
            <p className="text-muted-foreground">
              Reserva citas en segundos con nuestro calendario inteligente
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary-light mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Horarios Flexibles</h3>
            <p className="text-muted-foreground">
              Encuentra disponibilidad que se ajuste a tu rutina
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow mb-4">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chat Integrado</h3>
            <p className="text-muted-foreground">
              Comunícate directamente con tu profesional
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary-light mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
            <p className="text-muted-foreground">
              Pagos protegidos y profesionales verificados
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="text-lg mb-6 opacity-90">
            Únete a miles de usuarios que ya confían en AgendaPro
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
            <Link to="/registro">Crear Cuenta Gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
