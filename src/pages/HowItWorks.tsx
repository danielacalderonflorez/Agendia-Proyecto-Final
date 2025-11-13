import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Search, Calendar, CreditCard, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "1. Regístrate",
      description: "Crea tu cuenta gratis en menos de un minuto. Elige si eres cliente o profesional.",
    },
    {
      icon: Search,
      title: "2. Busca Profesionales",
      description: "Explora nuestra red de profesionales certificados. Filtra por profesión, precio y disponibilidad.",
    },
    {
      icon: Calendar,
      title: "3. Selecciona Horario",
      description: "Elige la fecha y hora que mejor te convenga del calendario del profesional.",
    },
    {
      icon: CreditCard,
      title: "4. Realiza el Pago",
      description: "Paga de forma segura. El profesional recibirá una notificación para aceptar tu cita.",
    },
    {
      icon: MessageSquare,
      title: "5. Comunícate",
      description: "Una vez aceptada la cita, podrás chatear con el profesional directamente en la plataforma.",
    },
    {
      icon: CheckCircle,
      title: "6. Disfruta el Servicio",
      description: "Acude a tu cita o conéctate online. Después, podrás calificar tu experiencia.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ¿Cómo Funciona?
            </h1>
            <p className="text-lg text-muted-foreground">
              Agendar una cita nunca fue tan fácil. Sigue estos simples pasos.
            </p>
          </div>

          <div className="space-y-8 mb-12">
            {steps.map((step, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                      index % 2 === 0 
                        ? 'bg-gradient-to-br from-primary to-primary-glow' 
                        : 'bg-gradient-to-br from-secondary to-secondary-light'
                    }`}>
                      <step.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">¿Eres Profesional?</h2>
            <p className="text-muted-foreground mb-6">
              Únete a nuestra plataforma y empieza a recibir clientes hoy mismo. 
              Gestiona tu agenda, acepta pagos y crece tu negocio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow">
                <Link to="/registro">Registrarme como Profesional</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/profesionales">Ver Profesionales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;