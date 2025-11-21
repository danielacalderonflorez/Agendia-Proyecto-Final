import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const bookingData = location.state;

  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-[#f9fafb] font-['Poppins',sans-serif]">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Datos de reserva no encontrados</h1>
          <Button 
            onClick={() => navigate("/profesionales")} 
            className="mt-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          >
            Volver a Profesionales
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Calculate end time (add 1 hour by default)
      const [hours, minutes] = bookingData.time.split(":");
      const startTime = `${hours}:${minutes}:00`;
      const endHour = (parseInt(hours) + 1).toString().padStart(2, "0");
      const endTime = `${endHour}:${minutes}:00`;

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          client_id: user.id,
          professional_id: bookingData.professionalId,
          appointment_date: bookingData.date,
          start_time: startTime,
          end_time: endTime,
          status: "pendiente_pago",
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create payment
      const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { error: paymentError } = await supabase.from("payments").insert({
        appointment_id: appointment.id,
        amount: bookingData.price,
        payment_reference: paymentReference,
      });

      if (paymentError) throw paymentError;

      // Update appointment status to paid
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "pendiente_aceptacion" })
        .eq("id", appointment.id);

      if (updateError) throw updateError;

      // Create notification for professional
      const { data: professionalData } = await supabase
        .from("professionals")
        .select("user_id")
        .eq("id", bookingData.professionalId)
        .single();

      if (professionalData?.user_id) {
        await supabase.from("notifications").insert({
          user_id: professionalData.user_id,
          type: "pago_realizado",
          title: "Nueva Cita Pendiente",
          message: `Tienes una nueva solicitud de cita para el ${format(
            new Date(bookingData.date),
            "PPP",
            { locale: es }
          )} a las ${bookingData.time}`,
          appointment_id: appointment.id,
        });
      }

      // Create notification for client
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "pago_realizado",
        title: "Pago Realizado",
        message: `Tu pago ha sido procesado correctamente. El profesional revisará tu solicitud pronto.`,
        appointment_id: appointment.id,
      });

      toast({
        title: "¡Pago exitoso!",
        description: "Tu cita ha sido registrada. Espera la confirmación del profesional.",
      });

      navigate("/mis-citas");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al procesar el pago",
        description: error.message || "Por favor intenta nuevamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-['Poppins',sans-serif]">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="mt-24 mb-8">
          <h1 className="text-[1.875rem] font-bold text-[#111827] text-center mb-2">
            Confirmar Reserva y Pago
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Booking Summary */}
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#111827]">Selecciona Fecha y Hora</h2>
            </div>
            <Card className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="p-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Profesional</p>
                    <p className="text-base font-medium text-[#1f2937]">{bookingData.professionalName}</p>
                    <p className="text-sm text-[#2563eb] font-medium">{bookingData.profession}</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#6b7280] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Fecha</p>
                      <p className="text-base font-medium text-[#1f2937]">
                        {format(new Date(bookingData.date), "PPP", { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#6b7280] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Hora</p>
                      <p className="text-base font-medium text-[#1f2937]">{bookingData.time}</p>
                    </div>
                  </div>

                  <hr className="border-t border-[#e5e7eb] my-6" />

                  <div>
                    <p className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Resumen de Pago</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-[#1f2937]">Total a pagar:</span>
                      <span className="text-xl font-bold text-[#1f2937] flex items-center">
                        <DollarSign className="h-5 w-5" />
                        {bookingData.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#111827]">Resumen de tu Cita</h2>
            </div>
            <Card className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
                  <CreditCard className="h-5 w-5 text-[#2563eb]" />
                  Información de Pago
                </CardTitle>
                <CardDescription className="text-sm text-[#6b7280]">
                  Este es un pago simulado. Usa cualquier dato.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-sm font-semibold text-[#1f2937]">
                      Número de Tarjeta
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardData.cardNumber}
                      onChange={(e) =>
                        setCardData({ ...cardData, cardNumber: e.target.value })
                      }
                      required
                      disabled={loading}
                      className="w-full p-4 border border-[#e5e7eb] rounded-md text-sm text-[#111827] transition-all focus:border-[#2563eb] focus:shadow-[0_8px_24px_rgba(37,99,235,0.15)] placeholder:text-[#6b7280]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName" className="text-sm font-semibold text-[#1f2937]">
                      Nombre en la Tarjeta
                    </Label>
                    <Input
                      id="cardName"
                      placeholder="Juan Pérez"
                      value={cardData.cardName}
                      onChange={(e) =>
                        setCardData({ ...cardData, cardName: e.target.value })
                      }
                      required
                      disabled={loading}
                      className="w-full p-4 border border-[#e5e7eb] rounded-md text-sm text-[#111827] transition-all focus:border-[#2563eb] focus:shadow-[0_8px_24px_rgba(37,99,235,0.15)] placeholder:text-[#6b7280]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate" className="text-sm font-semibold text-[#1f2937]">
                        Vencimiento
                      </Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/AA"
                        value={cardData.expiryDate}
                        onChange={(e) =>
                          setCardData({ ...cardData, expiryDate: e.target.value })
                        }
                        required
                        disabled={loading}
                        className="w-full p-4 border border-[#e5e7eb] rounded-md text-sm text-[#111827] transition-all focus:border-[#2563eb] focus:shadow-[0_8px_24px_rgba(37,99,235,0.15)] placeholder:text-[#6b7280]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-sm font-semibold text-[#1f2937]">
                        CVV
                      </Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={(e) =>
                          setCardData({ ...cardData, cvv: e.target.value })
                        }
                        required
                        disabled={loading}
                        className="w-full p-4 border border-[#e5e7eb] rounded-md text-sm text-[#111827] transition-all focus:border-[#2563eb] focus:shadow-[0_8px_24px_rgba(37,99,235,0.15)] placeholder:text-[#6b7280]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-4 bg-[#2563eb] text-white border-none rounded-md text-[15px] font-semibold cursor-pointer transition-all mt-2.5 hover:bg-transparent hover:border hover:border-[#2563eb] hover:text-[#2563eb] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Procesando..." : `Pagar $${bookingData.price.toLocaleString()}`}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#374151] text-white mt-16">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-2xl text-[#2563eb] mb-4 font-bold">Agendia</h2>
              <p className="text-[#d1d5db] text-sm leading-relaxed">
                Conectamos profesionales con clientes de manera fácil y segura.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <p className="text-[#d1d5db] text-sm mb-2">+57 301 314 0650</p>
              <p className="text-[#d1d5db] text-sm mb-2">contacto@agendia.com</p>
              <p className="text-[#d1d5db] text-sm">Santa Marta, Colombia</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Cuestiones Legales</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-[#d1d5db] text-sm hover:text-[#2563eb] transition-colors no-underline">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-[#d1d5db] text-sm hover:text-[#2563eb] transition-colors no-underline">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-[#d1d5db] text-sm hover:text-[#2563eb] transition-colors no-underline">
                    Aviso Legal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-[#1f2937] py-6 text-center">
          <p className="text-[#9ca3af] text-sm">
            Copyright © 2025 <strong className="text-[#2563eb]">Agendia - Conectando profesionales</strong>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Payment;