import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Profesional no encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Professional Info */}
          <Card>
            <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                  {professional.profiles?.full_name?.charAt(0) || "P"}
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {professional.profiles?.full_name}
                  </CardTitle>
                  <CardDescription className="text-primary font-medium text-lg">
                    {professional.profession}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Sobre mí</h3>
                <p className="text-muted-foreground">{professional.bio}</p>
              </div>
              <div className="flex items-center text-secondary font-bold text-2xl">
                <DollarSign className="h-6 w-6 mr-1" />
                {professional.price_per_hour}/hora
              </div>
            </CardContent>
          </Card>

          {/* Booking Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Reservar Cita
              </CardTitle>
              <CardDescription>
                Selecciona fecha y horario disponible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const minDate = startOfDay(addDays(new Date(), 1));
                  return isBefore(date, minDate);
                }}
                locale={es}
                className="rounded-md border"
              />

              {selectedDate && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horarios disponibles para {format(selectedDate, "PPP", { locale: es })}
                  </h4>
                  {timeSlots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No hay horarios disponibles para esta fecha
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          onClick={() => setSelectedSlot(slot)}
                          className={
                            selectedSlot === slot
                              ? "bg-gradient-to-r from-primary to-primary-glow"
                              : ""
                          }
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={!selectedDate || !selectedSlot}
                className="w-full bg-gradient-to-r from-secondary to-secondary-light"
                size="lg"
              >
                Continuar con la Reserva
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetail;