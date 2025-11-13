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

    // Subscribe to realtime updates
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Notificaciones
            </h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1">
                Tienes {unreadCount} notificación{unreadCount !== 1 ? "es" : ""} sin leer
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No tienes notificaciones</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer hover:shadow-md transition-all ${
                  !notification.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {notification.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <Badge
                      className={notificationTypeColors[notification.type] || "bg-gray-500"}
                    >
                      {notification.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(notification.created_at), "PPP 'a las' p", {
                        locale: es,
                      })}
                    </p>
                    {!notification.is_read && (
                      <Badge variant="outline" className="text-primary">
                        Nueva
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;