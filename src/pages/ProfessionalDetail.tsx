import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addDays, isBefore, startOfDay, addHours, parse } from "date-fns";
import { es } from "date-fns/locale";

interface Professional {
  id: string;
  profession: string;
  bio: string;
  price_per_hour: number;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Availability {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

const dayMap: { [key: string]: number } = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const ProfessionalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (id) {
      loadProfessional();
      loadAvailabilities();
    }
  }, [id]);

  useEffect(() => {
    if (selectedDate && availabilities.length > 0) {
      generateTimeSlots();
    }
  }, [selectedDate, availabilities]);

  const loadProfessional = async () => {
    try {
      const { data, error } = await supabase
        .from("professionals")
        .select(`
          id,
          profession,
          bio,
          price_per_hour,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfessional(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el profesional",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailabilities = async () => {
    try {
      const { data, error } = await supabase
        .from("availabilities")
        .select("*")
        .eq("professional_id", id)
        .eq("is_active", true);

      if (error) throw error;
      setAvailabilities(data || []);
    } catch (error: any) {
      console.error("Error loading availabilities:", error);
    }
  };

  const generateTimeSlots = async () => {
    if (!selectedDate) return;

    const dayOfWeek = selectedDate.getDay();
    const dayName = Object.keys(dayMap).find((key) => dayMap[key] === dayOfWeek);

    const availability = availabilities.find((av) => av.day_of_week === dayName);

    if (!availability) {
      setTimeSlots([]);
      return;
    }

    // Get existing appointments for this date
    const { data: appointments } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("professional_id", id)
      .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      .in("status", ["pendiente_pago", "pagada", "pendiente_aceptacion", "aceptada"]);

    const slots: string[] = [];
    const startTime = parse(availability.start_time, "HH:mm:ss", selectedDate);
    const endTime = parse(availability.end_time, "HH:mm:ss", selectedDate);
    const slotDuration = availability.slot_duration_minutes;

    let currentSlot = startTime;

    while (isBefore(currentSlot, endTime)) {
      const slotTime = format(currentSlot, "HH:mm");
      const slotDateTime = new Date(selectedDate);
      const [hours, minutes] = slotTime.split(":");
      slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Check if slot is in the past
      const now = new Date();
      const minBookingTime = addHours(now, 12);

      // Check if slot is already booked
      const isBooked = appointments?.some((apt) => {
        const aptStart = parse(apt.start_time, "HH:mm:ss", selectedDate);
        return format(aptStart, "HH:mm") === slotTime;
      });

      if (!isBefore(slotDateTime, minBookingTime) && !isBooked) {
        slots.push(slotTime);
      }

      currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
    }

    setTimeSlots(slots);
  };

  const handleBooking = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Debes iniciar sesión",
        description: "Por favor inicia sesión para reservar una cita",
      });
      navigate("/login");
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast({
        variant: "destructive",
        title: "Selecciona fecha y hora",
        description: "Debes seleccionar una fecha y hora para continuar",
      });
      return;
    }

    navigate("/pago", {
      state: {
        professionalId: id,
        professionalName: professional?.profiles?.full_name,
        profession: professional?.profession,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedSlot,
        price: professional?.price_per_hour,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] font-['Poppins',sans-serif]">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2563eb] border-t-transparent"></div>
          <p className="mt-4 text-[#6b7280] text-base">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-[#f9fafb] font-['Poppins',sans-serif]">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Profesional no encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] font-['Poppins',sans-serif]">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="mt-24 mb-8">
          <h1 className="text-[1.875rem] font-bold text-[#111827] text-center mb-2">
            Perfil del Profesional
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Professional Info */}
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#111827]">Información del Profesional</h2>
            </div>
            <Card className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="p-10 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#111827] mb-2">
                    {professional.profiles?.full_name}
                  </h3>
                  <p className="text-[#2563eb] font-medium text-lg">
                    {professional.profession}
                  </p>
                </div>
                <hr className="border-t border-[#e5e7eb]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Sobre mí</h3>
                  <p className="text-[#4b5563] text-base leading-relaxed">{professional.bio}</p>
                </div>
                <hr className="border-t border-[#e5e7eb]" />
                <div>
                  <p className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Tarifa por hora</p>
                  <div className="flex items-center text-[#1f2937] font-bold text-2xl">
                    <DollarSign className="h-6 w-6 mr-1 text-[#2563eb]" />
                    {professional.price_per_hour.toLocaleString()}/hora
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Calendar */}
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#111827]">Reservar Cita</h2>
            </div>
            <Card className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
                  <CalendarIcon className="h-5 w-5 text-[#2563eb]" />
                  Selecciona fecha y horario disponible
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const minDate = startOfDay(addDays(new Date(), 1));
                    return isBefore(date, minDate);
                  }}
                  locale={es}
                  className="rounded-lg border border-[#e5e7eb] mx-auto"
                />

                {selectedDate && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horarios para {format(selectedDate, "PPP", { locale: es })}
                    </h4>
                    {timeSlots.length === 0 ? (
                      <p className="text-[#6b7280] text-sm">
                        No hay horarios disponibles para esta fecha
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              selectedSlot === slot
                                ? "bg-[#2563eb] text-white shadow-md"
                                : "bg-white border border-[#e5e7eb] text-[#374151] hover:border-[#2563eb] hover:text-[#2563eb]"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedSlot}
                  className="w-full p-4 bg-[#2563eb] text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all hover:bg-transparent hover:border hover:border-[#2563eb] hover:text-[#2563eb] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2563eb] disabled:hover:text-white disabled:hover:translate-y-0"
                >
                  Continuar con la Reserva
                </button>
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

export default ProfessionalDetail;