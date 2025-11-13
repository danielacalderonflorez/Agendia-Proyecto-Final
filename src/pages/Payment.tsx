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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Datos de reserva no encontrados</h1>
          <Button onClick={() => navigate("/profesionales")} className="mt-4">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Confirmar Reserva y Pago</h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de la Cita</CardTitle>
                <CardDescription>Verifica los detalles antes de pagar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Profesional</p>
                  <p className="font-semibold">{bookingData.professionalName}</p>
                  <p className="text-sm text-primary">{bookingData.profession}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-semibold">
                      {format(new Date(bookingData.date), "PPP", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hora</p>
                    <p className="font-semibold">{bookingData.time}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold">Total a Pagar</span>
                    <span className="text-2xl font-bold text-secondary flex items-center">
                      <DollarSign className="h-6 w-6" />
                      {bookingData.price}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información de Pago
                </CardTitle>
                <CardDescription>
                  Este es un pago simulado. Usa cualquier dato.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardData.cardNumber}
                      onChange={(e) =>
                        setCardData({ ...cardData, cardNumber: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nombre en la Tarjeta</Label>
                    <Input
                      id="cardName"
                      placeholder="Juan Pérez"
                      value={cardData.cardName}
                      onChange={(e) =>
                        setCardData({ ...cardData, cardName: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/AA"
                        value={cardData.expiryDate}
                        onChange={(e) =>
                          setCardData({ ...cardData, expiryDate: e.target.value })
                        }
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={(e) =>
                          setCardData({ ...cardData, cvv: e.target.value })
                        }
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-secondary to-secondary-light"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Procesando..." : `Pagar $${bookingData.price}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;