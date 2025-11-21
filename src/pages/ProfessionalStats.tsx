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

      const now = new Date();
      let startDate = new Date();
      
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setMonth(now.getMonth() - 1);
      }

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_client_id_fkey(full_name)')
        .eq('professional_id', professional.id)
        .gte('appointment_date', startDate.toISOString().split('T')[0]);

      if (!appointments) {
        setStats(null);
        return;
      }

      const total = appointments.length;
      const confirmadas = appointments.filter(a => a.status === 'aceptada').length;
      const canceladas = appointments.filter(a => a.status === 'cancelada').length;
      const rechazadas = appointments.filter(a => a.status === 'rechazada').length;
      const completadas = appointments.filter(a => a.status === 'completada').length;
      const pendientes = appointments.filter(a => 
        a.status === 'pendiente_aceptacion' || a.status === 'pagada'
      ).length;

      const cancelacionesCliente = appointments.filter(a => 
        a.status === 'cancelada' && a.cancellation_reason
      ).length;
      const tasaCancelacionCliente = total > 0 ? (cancelacionesCliente / total) * 100 : 0;
      const tasaCancelacionProfesional = total > 0 ? (rechazadas / total) * 100 : 0;

      const { data: availabilities } = await supabase
        .from('availabilities')
        .select('*')
        .eq('professional_id', professional.id)
        .eq('is_active', true);

      let horasDisponibles = 0;
      if (availabilities) {
        availabilities.forEach(av => {
          const start = new Date(`2000-01-01T${av.start_time}`);
          const end = new Date(`2000-01-01T${av.end_time}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
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

      const daysInPeriod = period === 'day' ? 1 : period === 'week' ? 7 : 30;
      const promedioAtendidas = (confirmadas + completadas) / daysInPeriod;

      const diasMasDemandados: { [key: string]: number } = {};
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      appointments.forEach(a => {
        const date = new Date(a.appointment_date);
        const dayName = diasSemana[date.getDay()];
        diasMasDemandados[dayName] = (diasMasDemandados[dayName] || 0) + 1;
      });

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-[1200px] mx-auto px-8 py-8 mt-24">
          <div className="text-center text-[#6b7280]">No hay datos disponibles</div>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="mb-8 mt-24">
          <h1 className="text-[1.875rem] font-bold text-gray-900 mb-2">Estadísticas</h1>
          <p className="text-[#6b7280] text-base">Analiza el rendimiento de tus citas</p>
        </div>

        <div className="mb-6">
          <div className="inline-flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-gray-700">Total de Citas</h3>
              <Calendar className="h-5 w-5 text-[#6b7280]" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-[#6b7280] mt-1">
              En el período seleccionado
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-gray-700">Confirmadas</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.confirmadas}</div>
            <p className="text-xs text-[#6b7280] mt-1">
              {stats.total > 0 ? ((stats.confirmadas / stats.total) * 100).toFixed(1) : 0}% del total
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-gray-700">Completadas</h3>
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.completadas}</div>
            <p className="text-xs text-[#6b7280] mt-1">
              {stats.total > 0 ? ((stats.completadas / stats.total) * 100).toFixed(1) : 0}% del total
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-gray-700">Pendientes</h3>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.pendientes}</div>
            <p className="text-xs text-[#6b7280] mt-1">
              Por confirmar
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-gray-700">Canceladas</h3>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.canceladas}</div>
            <p className="text-xs text-[#6b7280] mt-1">
              {stats.tasaCancelacionCliente.toFixed(1)}% tasa
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-medium text-gray-700">Rechazadas</h3>
              <XCircle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.rechazadas}</div>
            <p className="text-xs text-[#6b7280] mt-1">
              {stats.tasaCancelacionProfesional.toFixed(1)}% tasa
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Ocupación del Horario</h2>
              <p className="text-sm text-[#6b7280] mt-1">Horas disponibles vs ocupadas</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#6b7280]">Horas disponibles:</span>
                  <span className="font-semibold text-gray-900">{stats.horasDisponibles.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#6b7280]">Horas ocupadas:</span>
                  <span className="font-semibold text-gray-900">{stats.horasOcupadas.toFixed(1)}h</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Tasa de ocupación:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {stats.tasaOcupacion.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Promedio de Atención</h2>
              <p className="text-sm text-[#6b7280] mt-1">
                Citas atendidas por {period === 'day' ? 'día' : period === 'week' ? 'semana' : 'mes'}
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-600">
                {stats.promedioAtendidas.toFixed(1)}
              </div>
              <p className="text-sm text-[#6b7280] mt-2">
                citas atendidas en promedio
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Días Más Demandados</h2>
              <p className="text-sm text-[#6b7280] mt-1">Top 3 días con más citas</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {getTopDays().map(([day, count], index) => (
                  <div key={day} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{day}</span>
                    </span>
                    <span className="font-bold text-blue-600">{count} citas</span>
                  </div>
                ))}
                {getTopDays().length === 0 && (
                  <p className="text-sm text-[#6b7280] text-center py-4">No hay datos disponibles</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Horarios Más Demandados</h2>
              <p className="text-sm text-[#6b7280] mt-1">Top 5 horarios más solicitados</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {getTopHours().map(([hour, count], index) => (
                  <div key={hour} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{hour}</span>
                    </span>
                    <span className="font-bold text-blue-600">{count} citas</span>
                  </div>
                ))}
                {getTopHours().length === 0 && (
                  <p className="text-sm text-[#6b7280] text-center py-4">No hay datos disponibles</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalStats;