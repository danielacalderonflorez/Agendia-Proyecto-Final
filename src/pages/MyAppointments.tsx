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
  const [filterClient, setFilterClient] = useState<string>("todas");
  const [filterProfessional, setFilterProfessional] = useState<string>("todas");

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || null);

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

      const appointment = professionalAppointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        const { data: fullAppointment } = await supabase
          .from("appointments")
          .select(`
            *,
            profiles:client_id(email, full_name),
            professionals(user_id, profiles:user_id(email, full_name))
          `)
          .eq("id", appointmentId)
          .single();

        if (fullAppointment?.client_id) {
          await supabase.from("notifications").insert({
            user_id: fullAppointment.client_id,
            type: "cita_aceptada",
            title: "Cita Aceptada",
            message: `Tu cita para el ${format(
              parseISO(appointment.appointment_date),
              "PPP",
              { locale: es }
            )} a las ${appointment.start_time.slice(0, 5)} ha sido aceptada.`,
            appointment_id: appointmentId,
          });

          try {
            const calendarResponse = await supabase.functions.invoke(
              'google-calendar-integration',
              {
                body: {
                  appointmentId: appointmentId,
                  professionalEmail: fullAppointment.professionals?.profiles?.email || '',
                  clientEmail: fullAppointment.profiles?.email || '',
                  appointmentDate: fullAppointment.appointment_date,
                  appointmentTime: fullAppointment.start_time,
                  professionalName: fullAppointment.professionals?.profiles?.full_name || 'Profesional',
                  clientName: fullAppointment.profiles?.full_name || 'Cliente',
                }
              }
            );

            if (calendarResponse.error) {
              console.error('Google Calendar error:', calendarResponse.error);
              toast({
                title: "Cita aceptada",
                description: "Cita aceptada pero no se pudo crear el evento en Google Calendar",
              });
            } else {
              toast({
                title: "Cita aceptada",
                description: "La cita ha sido aceptada y agregada a Google Calendar",
              });
            }
          } catch (calendarError) {
            console.error('Failed to create calendar event:', calendarError);
            toast({
              title: "Cita aceptada",
              description: "Cita aceptada correctamente",
            });
          }
        }
      } else {
        toast({
          title: "Cita aceptada",
          description: "La cita ha sido aceptada correctamente",
        });
      }

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

  const getFilteredCount = (appointmentsList: Appointment[], status: string) => {
    if (status === 'todas') return appointmentsList.length;
    return appointmentsList.filter(a => a.status === status).length;
  };

  const renderAppointmentCard = (appointment: Appointment, isProfessional: boolean = false) => (
    <div
      key={appointment.id}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 flex flex-col gap-4"
      style={{ borderColor: appointment.status === 'aceptada' ? '#e5e7eb' : '#e5e7eb' }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            {isProfessional
              ? appointment.profiles?.full_name
              : appointment.professionals?.profiles?.full_name}
          </h3>
          {!isProfessional && appointment.professionals?.profession && (
            <p className="text-sm text-gray-500">{appointment.professionals.profession}</p>
          )}
        </div>
        <Badge className={statusColors[appointment.status]}>
          {statusLabels[appointment.status]}
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{format(parseISO(appointment.appointment_date), "PPP", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{appointment.start_time.slice(0, 5)}</span>
          </div>
        </div>
      </div>

      {appointment.cancellation_reason && (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">Motivo de cancelación:</p>
          <p className="text-sm text-gray-600">{appointment.cancellation_reason}</p>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={() => navigate(`/chat/${appointment.id}`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-transparent hover:border hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>

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
                <button
                  onClick={() => setCancellingId(appointment.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg font-semibold text-sm hover:bg-transparent hover:border hover:border-gray-800 hover:text-gray-800 transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
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
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Confirmar Cancelación
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

        {isProfessional && appointment.status === "pendiente_aceptacion" && (
          <>
            <button
              onClick={() => handleAcceptAppointment(appointment.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-transparent hover:border hover:border-green-500 hover:text-green-500 transition-all duration-300"
            >
              <CheckCircle className="h-4 w-4" />
              Aceptar
            </button>
            <button
              onClick={() => handleRejectAppointment(appointment.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg font-semibold text-sm hover:bg-transparent hover:border hover:border-gray-800 hover:text-gray-800 transition-all duration-300"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </button>
          </>
        )}

        {isProfessional && appointment.status === "aceptada" && (
          <button
            onClick={() => handleCompleteAppointment(appointment.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg font-semibold text-sm hover:bg-transparent hover:border hover:border-gray-500 hover:text-gray-500 transition-all duration-300"
          >
            <CheckCircle className="h-4 w-4" />
            Marcar Completada
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <h1 className="text-[1.875rem] font-bold mb-8 text-gray-900 mt-24">Mis Citas</h1>

        {/* Client Appointments */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Como Cliente</h2>
          </div>

          <div className="flex gap-4 border-b-2 border-gray-200 mb-8 flex-wrap">
            <button
              onClick={() => setFilterClient('todas')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                filterClient === 'todas'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
              }`}
            >
              Todas
              <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                {getFilteredCount(appointments, 'todas')}
              </span>
            </button>
            <button
              onClick={() => setFilterClient('pendiente_aceptacion')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                filterClient === 'pendiente_aceptacion'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
              }`}
            >
              Por Confirmar
              <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                {getFilteredCount(appointments, 'pendiente_aceptacion')}
              </span>
            </button>
            <button
              onClick={() => setFilterClient('aceptada')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                filterClient === 'aceptada'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
              }`}
            >
              Confirmadas
              <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                {getFilteredCount(appointments, 'aceptada')}
              </span>
            </button>
            <button
              onClick={() => setFilterClient('completada')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                filterClient === 'completada'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
              }`}
            >
              Completadas
              <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                {getFilteredCount(appointments, 'completada')}
              </span>
            </button>
            <button
              onClick={() => setFilterClient('cancelada')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                filterClient === 'cancelada'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
              }`}
            >
              Canceladas
              <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                {getFilteredCount(appointments, 'cancelada')}
              </span>
            </button>
            <button
              onClick={() => setFilterClient('rechazada')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                filterClient === 'rechazada'
                  ? 'text-blue-600 border-b-4 border-blue-600'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
              }`}
            >
              Rechazadas
              <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                {getFilteredCount(appointments, 'rechazada')}
              </span>
            </button>
          </div>

          {appointments.filter(a => filterClient === 'todas' || a.status === filterClient).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  {appointments.length === 0 
                    ? "No tienes citas como cliente" 
                    : "No hay citas con este filtro"}
                </p>
                {appointments.length === 0 && (
                  <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                    <a href="/profesionales">Buscar Profesionales</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {appointments
                .filter(a => filterClient === 'todas' || a.status === filterClient)
                .map((apt) => renderAppointmentCard(apt, false))}
            </div>
          )}
        </div>

        {/* Professional Appointments */}
        {userRole === "profesional" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Como Profesional</h2>
            </div>

            <div className="flex gap-4 border-b-2 border-gray-200 mb-8 flex-wrap">
              <button
                onClick={() => setFilterProfessional('todas')}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                  filterProfessional === 'todas'
                    ? 'text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
                }`}
              >
                Todas
                <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                  {getFilteredCount(professionalAppointments, 'todas')}
                </span>
              </button>
              <button
                onClick={() => setFilterProfessional('pendiente_aceptacion')}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                  filterProfessional === 'pendiente_aceptacion'
                    ? 'text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
                }`}
              >
                Por Confirmar
                <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                  {getFilteredCount(professionalAppointments, 'pendiente_aceptacion')}
                </span>
              </button>
              <button
                onClick={() => setFilterProfessional('aceptada')}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                  filterProfessional === 'aceptada'
                    ? 'text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
                }`}
              >
                Confirmadas
                <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                  {getFilteredCount(professionalAppointments, 'aceptada')}
                </span>
              </button>
              <button
                onClick={() => setFilterProfessional('completada')}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                  filterProfessional === 'completada'
                    ? 'text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
                }`}
              >
                Completadas
                <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                  {getFilteredCount(professionalAppointments, 'completada')}
                </span>
              </button>
              <button
                onClick={() => setFilterProfessional('cancelada')}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                  filterProfessional === 'cancelada'
                    ? 'text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
                }`}
              >
                Canceladas
                <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                  {getFilteredCount(professionalAppointments, 'cancelada')}
                </span>
              </button>
              <button
                onClick={() => setFilterProfessional('rechazada')}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all duration-300 -mb-0.5 ${
                  filterProfessional === 'rechazada'
                    ? 'text-blue-600 border-b-4 border-blue-600'
                    : 'text-gray-500 border-b-4 border-transparent hover:text-blue-600'
                }`}
              >
                Rechazadas
                <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs font-bold">
                  {getFilteredCount(professionalAppointments, 'rechazada')}
                </span>
              </button>
            </div>

            {professionalAppointments.filter(a => filterProfessional === 'todas' || a.status === filterProfessional).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    {professionalAppointments.length === 0 
                      ? "No tienes citas como profesional" 
                      : "No hay citas con este filtro"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {professionalAppointments
                  .filter(a => filterProfessional === 'todas' || a.status === filterProfessional)
                  .map((apt) => renderAppointmentCard(apt, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;