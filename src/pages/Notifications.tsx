import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  appointment_id: string | null;
}

const notificationTypeColors: { [key: string]: string } = {
  pago_realizado: "bg-blue-500",
  cita_aceptada: "bg-green-500",
  cita_rechazada: "bg-red-500",
  cita_cancelada: "bg-orange-500",
  recordatorio_cita: "bg-purple-500",
  cita_completada: "bg-gray-500",
};

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((current) => [payload.new as Notification, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((current) =>
        current.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo marcar como leída",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((current) =>
        current.map((n) => ({ ...n, is_read: true }))
      );

      toast({
        title: "Listo",
        description: "Todas las notificaciones marcadas como leídas",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron marcar las notificaciones",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.appointment_id) {
      navigate("/mis-citas");
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8 mt-24">
          <div>
            <h1 className="text-[1.875rem] font-bold text-gray-900 flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Notificaciones
            </h1>
            {unreadCount > 0 && (
              <p className="text-[#6b7280] mt-2 text-base">
                Tienes {unreadCount} notificación{unreadCount !== 1 ? "es" : ""} sin leer
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all duration-300"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <Bell className="h-16 w-16 mx-auto text-[#6b7280] mb-4" />
            <p className="text-lg text-[#6b7280]">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
                  !notification.is_read ? "border-l-4 border-l-blue-600 bg-blue-50" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-[#6b7280] leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <Badge
                      className={`${notificationTypeColors[notification.type] || "bg-gray-500"} ml-4 flex-shrink-0`}
                    >
                      {notification.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <p className="text-xs text-[#9ca3af]">
                      {format(parseISO(notification.created_at), "PPP 'a las' p", {
                        locale: es,
                      })}
                    </p>
                    {!notification.is_read && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600 border border-blue-200">
                        Nueva
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;