import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  profiles: {
    full_name: string;
  };
}

const statusColors: { [key: string]: string } = {
  pendiente_pago: "bg-yellow-500",
  pagada: "bg-blue-500",
  pendiente_aceptacion: "bg-orange-500",
  aceptada: "bg-green-500",
  rechazada: "bg-red-500",
  completada: "bg-purple-500",
  cancelada: "bg-gray-500",
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

const ProfessionalCalendar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [professionalId, setProfessionalId] = useState<string>("");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!professional) {
        toast.error('No tienes un perfil de profesional');
        navigate('/perfil');
        return;
      }

      setProfessionalId(professional.id);

      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          profiles!appointments_client_id_fkey(full_name)
        `)
        .eq('professional_id', professional.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading appointments:', error);
        toast.error('Error al cargar las citas');
        return;
      }

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date | undefined) => {
    if (!date) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const getDatesWithAppointments = () => {
    const dates = new Set<string>();
    appointments.forEach(apt => {
      dates.add(apt.appointment_date);
    });
    return Array.from(dates).map(d => new Date(d + 'T00:00:00'));
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

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
        <div className="mb-8 mt-24">
          <h1 className="text-[1.875rem] font-bold text-gray-900 mb-2">Mi Calendario</h1>
          <p className="text-[#6b7280] text-base">Visualiza todas tus citas programadas</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Calendar Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Selecciona una fecha</h2>
              <p className="text-sm text-[#6b7280] mt-1">
                Las fechas con citas están marcadas
              </p>
            </div>
            <div className="p-6 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                className="rounded-md border border-gray-200"
                modifiers={{
                  hasAppointment: getDatesWithAppointments()
                }}
                modifiersStyles={{
                  hasAppointment: {
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    color: '#2563eb'
                  }
                }}
              />
            </div>
          </div>

          {/* Appointments List Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Citas del {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : ''}
              </h2>
              <p className="text-sm text-[#6b7280] mt-1">
                {selectedDateAppointments.length} cita{selectedDateAppointments.length !== 1 ? 's' : ''} programada{selectedDateAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-6">
              {selectedDateAppointments.length === 0 ? (
                <p className="text-sm text-[#6b7280] text-center py-8">
                  No hay citas programadas para este día
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedDateAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {appointment.profiles.full_name}
                          </p>
                          <p className="text-sm text-[#6b7280]">
                            {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                          </p>
                        </div>
                        <Badge className={statusColors[appointment.status]}>
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => navigate(`/chat/${appointment.id}`)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          Ver chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mt-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Resumen de Citas</h2>
            <p className="text-sm text-[#6b7280] mt-1">Vista general de todas tus citas</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">
                  {appointments.length}
                </p>
                <p className="text-sm text-[#6b7280] mt-1">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'aceptada').length}
                </p>
                <p className="text-sm text-[#6b7280] mt-1">Aceptadas</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {appointments.filter(a => a.status === 'pendiente_aceptacion').length}
                </p>
                <p className="text-sm text-[#6b7280] mt-1">Pendientes</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">
                  {appointments.filter(a => a.status === 'completada').length}
                </p>
                <p className="text-sm text-[#6b7280] mt-1">Completadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCalendar;