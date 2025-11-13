import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, MessageSquare, X, CheckCircle, XCircle } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  cancellation_reason: string | null;
  profiles?: {
    full_name: string;
  };
  professionals?: {
    profession: string;
    profiles: {
      full_name: string;
    };
  };
}

const statusColors: { [key: string]: string } = {
  pendiente_pago: "bg-yellow-500",
  pagada: "bg-blue-500",
  pendiente_aceptacion: "bg-orange-500",
  aceptada: "bg-green-500",
  rechazada: "bg-red-500",
  completada: "bg-gray-500",
  cancelada: "bg-gray-400",
};

const statusLabels: { [key: string]: string } = {
  pendiente_pago: "Pendiente de Pago",
  pagada: "Pagada",
  pendiente_aceptacion: "Pendiente de Aceptación",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  completada: "Completada",
  cancelada: "Cancelada",
};

const MyAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionalAppointments, setProfessionalAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || null);

      // Load appointments as client
      const { data: clientAppts, error: clientError } = await supabase
        .from("appointments")
        .select(`
          *,
          professionals (
            profession,
            profiles (
              full_name
            )
          )
        `)
        .eq("client_id", user.id)
        .order("appointment_date", { ascending: false });

      if (clientError) throw clientError;
      setAppointments(clientAppts || []);

      // If professional, load their appointments
      if (profile?.role === "profesional") {
        const { data: profData } = await supabase
          .from("professionals")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profData) {
          const { data: profAppts, error: profError } = await supabase
            .from("appointments")
            .select(`
              *,
              profiles (
                full_name
              )
            `)
            .eq("professional_id", profData.id)
            .order("appointment_date", { ascending: false });

          if (profError) throw profError;
          setProfessionalAppointments(profAppts || []);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las citas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!cancellationReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes proporcionar un motivo de cancelación",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelada",
          cancellation_reason: cancellationReason,
        })
        .eq("id", appointmentId);

      if (error) throw error;

      // Get appointment details for notification
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        const { data: professional } = await supabase
          .from("appointments")
          .select("professional_id, professionals(user_id)")
          .eq("id", appointmentId)
          .single();

        if (professional?.professionals?.user_id) {
          await supabase.from("notifications").insert({
            user_id: professional.professionals.user_id,
            type: "cita_cancelada",
            title: "Cita Cancelada",
            message: `La cita del ${format(
              parseISO(appointment.appointment_date),
              "PPP",
              { locale: es }
            )} ha sido cancelada. Motivo: ${cancellationReason}`,
            appointment_id: appointmentId,
          });
        }
      }

      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada correctamente",
      });

      setCancellationReason("");
      setCancellingId(null);
      loadUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la cita",
      });
    }
  };

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "aceptada" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Get client ID for notification
      const appointment = professionalAppointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        const { data: apptData } = await supabase
          .from("appointments")
          .select("client_id")
          .eq("id", appointmentId)
          .single();

        if (apptData?.client_id) {
          await supabase.from("notifications").insert({
            user_id: apptData.client_id,
            type: "cita_aceptada",
            title: "Cita Aceptada",
            message: `Tu cita para el ${format(
              parseISO(appointment.appointment_date),
              "PPP",
              { locale: es }
            )} a las ${appointment.start_time.slice(0, 5)} ha sido aceptada.`,
            appointment_id: appointmentId,
          });
        }
      }

      toast({
        title: "Cita aceptada",
        description: "La cita ha sido aceptada correctamente",
      });

      loadUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo aceptar la cita",
      });
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "rechazada" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Get client ID for notification
      const appointment = professionalAppointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        const { data: apptData } = await supabase
          .from("appointments")
          .select("client_id")
          .eq("id", appointmentId)
          .single();

        if (apptData?.client_id) {
          await supabase.from("notifications").insert({
            user_id: apptData.client_id,
            type: "cita_rechazada",
            title: "Cita Rechazada",
            message: `Tu cita para el ${format(
              parseISO(appointment.appointment_date),
              "PPP",
              { locale: es }
            )} ha sido rechazada por el profesional.`,
            appointment_id: appointmentId,
          });
        }
      }

      toast({
        title: "Cita rechazada",
        description: "La cita ha sido rechazada",
      });

      loadUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo rechazar la cita",
      });
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const appointment = professionalAppointments.find((apt) => apt.id === appointmentId);
      if (!appointment) return;

      const appointmentDateTime = parseISO(
        `${appointment.appointment_date}T${appointment.start_time}`
      );

      if (!isPast(appointmentDateTime)) {
        toast({
          variant: "destructive",
          title: "No se puede completar",
          description: "Solo puedes marcar como completada una cita que ya ocurrió",
        });
        return;
      }

      const { error } = await supabase
        .from("appointments")
        .update({ status: "completada" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Get client ID for notification
      const { data: apptData } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("id", appointmentId)
        .single();

      if (apptData?.client_id) {
        await supabase.from("notifications").insert({
          user_id: apptData.client_id,
          type: "cita_completada",
          title: "Cita Completada",
          message: `Tu cita ha sido marcada como completada.`,
          appointment_id: appointmentId,
        });
      }

      toast({
        title: "Cita completada",
        description: "La cita ha sido marcada como completada",
      });

      loadUserData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar la cita",
      });
    }
  };

  const renderAppointmentCard = (appointment: Appointment, isProfessional: boolean = false) => (
    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isProfessional
                ? appointment.profiles?.full_name
                : appointment.professionals?.profiles?.full_name}
            </CardTitle>
            <CardDescription>
              {!isProfessional && appointment.professionals?.profession}
            </CardDescription>
          </div>
          <Badge className={statusColors[appointment.status]}>
            {statusLabels[appointment.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(parseISO(appointment.appointment_date), "PPP", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.start_time.slice(0, 5)}</span>
          </div>
        </div>

        {appointment.cancellation_reason && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Motivo de cancelación:</p>
            <p className="text-sm text-muted-foreground">{appointment.cancellation_reason}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/chat/${appointment.id}`)}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>

          {!isProfessional &&
            appointment.status !== "cancelada" &&
            appointment.status !== "completada" &&
            appointment.status !== "rechazada" && (
              <Dialog
                open={cancellingId === appointment.id}
                onOpenChange={(open) => {
                  if (!open) {
                    setCancellingId(null);
                    setCancellationReason("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancellingId(appointment.id)}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancelar Cita</DialogTitle>
                    <DialogDescription>
                      Por favor indica el motivo de la cancelación
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Motivo de cancelación..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCancellingId(null);
                        setCancellationReason("");
                      }}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="flex-1 bg-destructive hover:bg-destructive/90"
                    >
                      Confirmar Cancelación
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

          {isProfessional && appointment.status === "pendiente_aceptacion" && (
            <>
              <Button
                size="sm"
                onClick={() => handleAcceptAppointment(appointment.id)}
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceptar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRejectAppointment(appointment.id)}
                className="text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </>
          )}

          {isProfessional && appointment.status === "aceptada" && (
            <Button
              size="sm"
              onClick={() => handleCompleteAppointment(appointment.id)}
              className="bg-gray-500 hover:bg-gray-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Completada
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Citas</h1>

        {/* Client Appointments */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Como Cliente</h2>
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tienes citas como cliente</p>
                <Button asChild className="mt-4">
                  <a href="/profesionales">Buscar Profesionales</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {appointments.map((apt) => renderAppointmentCard(apt, false))}
            </div>
          )}
        </div>

        {/* Professional Appointments */}
        {userRole === "profesional" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Como Profesional</h2>
            {professionalAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No tienes citas como profesional</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {professionalAppointments.map((apt) => renderAppointmentCard(apt, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;