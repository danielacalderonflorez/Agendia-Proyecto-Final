import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  professionals?: {
    profiles: {
      full_name: string;
    };
  };
  profiles?: {
    full_name: string;
  };
}

const Chat = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `appointment_id=eq.${appointmentId}`,
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data } = await supabase
            .from("chat_messages")
            .select(`
              id,
              message,
              sender_id,
              created_at,
              profiles (
                full_name
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((current) => [...current, data as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setCurrentUserId(user.id);

      // Load appointment details
      const { data: apptData, error: apptError } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          start_time,
          professionals (
            profiles (
              full_name
            )
          ),
          profiles (
            full_name
          )
        `)
        .eq("id", appointmentId)
        .single();

      if (apptError) throw apptError;
      setAppointment(apptData);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          sender_id,
          created_at,
          profiles (
            full_name
          )
        `)
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el chat",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("chat_messages").insert({
        appointment_id: appointmentId,
        sender_id: currentUserId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el mensaje",
      });
    } finally {
      setSending(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/mis-citas")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Citas
        </Button>

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle>
              Chat - Cita del{" "}
              {appointment &&
                format(parseISO(appointment.appointment_date), "PPP", { locale: es })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Con:{" "}
              {appointment?.professionals?.profiles?.full_name ||
                appointment?.profiles?.full_name}
            </p>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>No hay mensajes aún. ¡Inicia la conversación!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUserId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === currentUserId
                        ? "bg-gradient-to-r from-primary to-primary-glow text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.profiles?.full_name}
                    </p>
                    <p className="break-words">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender_id === currentUserId
                          ? "text-white/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(parseISO(message.created_at), "p", { locale: es })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;