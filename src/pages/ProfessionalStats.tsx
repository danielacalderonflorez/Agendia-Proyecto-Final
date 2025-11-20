import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Clock, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Stats {
  total: number;
  confirmadas: number;
  canceladas: number;
  rechazadas: number;
  completadas: number;
  pendientes: number;
  tasaCancelacionCliente: number;
  tasaCancelacionProfesional: number;
  horasDisponibles: number;
  horasOcupadas: number;
  tasaOcupacion: number;
  promedioAtendidas: number;
  diasMasDemandados: { [key: string]: number };
  horariosMasDemandados: { [key: string]: number };
}

const ProfessionalStats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Obtener el profesional
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

      // Calcular fechas según el período
      const now = new Date();
      let startDate = new Date();
      
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setMonth(now.getMonth() - 1);
      }

      // Obtener todas las citas del profesional en el período
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_client_id_fkey(full_name)')
        .eq('professional_id', professional.id)
        .gte('appointment_date', startDate.toISOString().split('T')[0]);

      if (!appointments) {
        setStats(null);
        return;
      }

      // Calcular estadísticas
      const total = appointments.length;
      const confirmadas = appointments.filter(a => a.status === 'aceptada').length;
      const canceladas = appointments.filter(a => a.status === 'cancelada').length;
      const rechazadas = appointments.filter(a => a.status === 'rechazada').length;
      const completadas = appointments.filter(a => a.status === 'completada').length;
      const pendientes = appointments.filter(a => 
        a.status === 'pendiente_aceptacion' || a.status === 'pagada'
      ).length;

      // Tasa de cancelación (asumiendo que las canceladas con razón son del cliente)
      const cancelacionesCliente = appointments.filter(a => 
        a.status === 'cancelada' && a.cancellation_reason
      ).length;
      const tasaCancelacionCliente = total > 0 ? (cancelacionesCliente / total) * 100 : 0;
      const tasaCancelacionProfesional = total > 0 ? (rechazadas / total) * 100 : 0;

      // Obtener disponibilidad del profesional
      const { data: availabilities } = await supabase
        .from('availabilities')
        .select('*')
        .eq('professional_id', professional.id)
        .eq('is_active', true);

      // Calcular horas disponibles y ocupadas
      let horasDisponibles = 0;
      if (availabilities) {
        availabilities.forEach(av => {
          const start = new Date(`2000-01-01T${av.start_time}`);
          const end = new Date(`2000-01-01T${av.end_time}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          // Multiplicar por días en el período
          const daysInPeriod = period === 'day' ? 1 : period === 'week' ? 7 : 30;
          horasDisponibles += hours * daysInPeriod;
        });
      }

      const horasOcupadas = appointments.reduce((acc, a) => {
        if (a.status === 'aceptada' || a.status === 'completada') {
          const start = new Date(`2000-01-01T${a.start_time}`);
          const end = new Date(`2000-01-01T${a.end_time}`);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
        return acc;
      }, 0);

      const tasaOcupacion = horasDisponibles > 0 ? (horasOcupadas / horasDisponibles) * 100 : 0;

      // Promedio de citas atendidas
      const daysInPeriod = period === 'day' ? 1 : period === 'week' ? 7 : 30;
      const promedioAtendidas = (confirmadas + completadas) / daysInPeriod;

      // Días más demandados
      const diasMasDemandados: { [key: string]: number } = {};
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      appointments.forEach(a => {
        const date = new Date(a.appointment_date);
        const dayName = diasSemana[date.getDay()];
        diasMasDemandados[dayName] = (diasMasDemandados[dayName] || 0) + 1;
      });

      // Horarios más demandados
      const horariosMasDemandados: { [key: string]: number } = {};
      appointments.forEach(a => {
        const hour = a.start_time.substring(0, 5);
        horariosMasDemandados[hour] = (horariosMasDemandados[hour] || 0) + 1;
      });

      setStats({
        total,
        confirmadas,
        canceladas,
        rechazadas,
        completadas,
        pendientes,
        tasaCancelacionCliente,
        tasaCancelacionProfesional,
        horasDisponibles,
        horasOcupadas,
        tasaOcupacion,
        promedioAtendidas,
        diasMasDemandados,
        horariosMasDemandados
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando estadísticas...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">No hay datos disponibles</div>
        </div>
      </div>
    );
  }

  const getTopDays = () => {
    return Object.entries(stats.diasMasDemandados)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const getTopHours = () => {
    return Object.entries(stats.horariosMasDemandados)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Estadísticas</h1>
          <p className="text-muted-foreground">Analiza el rendimiento de tus citas</p>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="day">Día</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Citas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                En el período seleccionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmadas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.confirmadas / stats.total) * 100).toFixed(1) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completadas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.completadas / stats.total) * 100).toFixed(1) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendientes}</div>
              <p className="text-xs text-muted-foreground">
                Por confirmar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.canceladas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.tasaCancelacionCliente.toFixed(1)}% tasa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
              <XCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rechazadas}</div>
              <p className="text-xs text-muted-foreground">
                {stats.tasaCancelacionProfesional.toFixed(1)}% tasa
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ocupación del Horario
              </CardTitle>
              <CardDescription>Horas disponibles vs ocupadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Horas disponibles:</span>
                  <span className="font-medium">{stats.horasDisponibles.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Horas ocupadas:</span>
                  <span className="font-medium">{stats.horasOcupadas.toFixed(1)}h</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tasa de ocupación:</span>
                    <span className="text-2xl font-bold text-primary">
                      {stats.tasaOcupacion.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Promedio de Atención
              </CardTitle>
              <CardDescription>Citas atendidas por {period === 'day' ? 'día' : period === 'week' ? 'semana' : 'mes'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.promedioAtendidas.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                citas atendidas en promedio
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Días Más Demandados
              </CardTitle>
              <CardDescription>Top 3 días con más citas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getTopDays().map(([day, count], index) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                      <span>{day}</span>
                    </span>
                    <span className="font-bold">{count} citas</span>
                  </div>
                ))}
                {getTopDays().length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios Más Demandados
              </CardTitle>
              <CardDescription>Top 5 horarios más solicitados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getTopHours().map(([hour, count], index) => (
                  <div key={hour} className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                      <span>{hour}</span>
                    </span>
                    <span className="font-bold">{count} citas</span>
                  </div>
                ))}
                {getTopHours().length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalStats;