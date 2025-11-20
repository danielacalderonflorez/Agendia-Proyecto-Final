import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Briefcase, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { es } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Professional {
  id: string;
  profession: string;
  bio: string;
  price_per_hour: number;
}

interface Availability {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

const daysOfWeek = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(false);

  const [newAvailability, setNewAvailability] = useState({
    day_of_week: "lunes",
    start_time: "09:00",
    end_time: "18:00",
    slot_duration_minutes: 60,
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // If professional, load professional data
      if (profileData.role === "profesional") {
        const { data: profData } = await supabase
          .from("professionals")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setProfessional(profData);

        if (profData) {
          // Load availabilities
          const { data: availData } = await supabase
            .from("availabilities")
            .select("*")
            .eq("professional_id", profData.id)
            .eq("is_active", true)
            .order("day_of_week");

          setAvailabilities(availData || []);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: profile.full_name })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada",
      });
      setEditingProfile(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfessional = async () => {
    if (!professional || !profile) return;
    setSaving(true);

    try {
      // Validate professional data
      if (!professional.profession || professional.profession === "Por definir" || professional.profession.trim() === "") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa tu profesión",
        });
        setSaving(false);
        return;
      }

      if (!professional.price_per_hour || professional.price_per_hour <= 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa un precio por hora válido",
        });
        setSaving(false);
        return;
      }

      if (professional.id) {
        const { error } = await supabase
          .from("professionals")
          .update({
            profession: professional.profession,
            bio: professional.bio,
            price_per_hour: professional.price_per_hour,
            is_active: true, // Activate profile when completed
          })
          .eq("id", professional.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("professionals").insert({
          user_id: profile.id,
          profession: professional.profession,
          bio: professional.bio,
          price_per_hour: professional.price_per_hour,
          is_active: true,
        });

        if (error) throw error;
      }

      toast({
        title: "Datos profesionales actualizados",
        description: "Tu perfil ha sido activado y ahora estás visible para los clientes",
      });
      setEditingProfessional(false);
      loadProfileData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los datos profesionales",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAvailability = async () => {
    if (!professional) return;

    try {
      const { error } = await supabase.from("availabilities").insert([{
        professional_id: professional.id,
        day_of_week: newAvailability.day_of_week as any,
        start_time: `${newAvailability.start_time}:00`,
        end_time: `${newAvailability.end_time}:00`,
        slot_duration_minutes: newAvailability.slot_duration_minutes,
      }]);

      if (error) throw error;

      toast({
        title: "Disponibilidad agregada",
        description: "Tu horario ha sido actualizado",
      });

      loadProfileData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la disponibilidad",
      });
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from("availabilities")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Disponibilidad eliminada",
        description: "El horario ha sido removido",
      });

      setAvailabilities((current) => current.filter((a) => a.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la disponibilidad",
      });
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
        <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

        {/* Basic Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              {editingProfile ? (
                <Input
                  value={profile?.full_name || ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, full_name: e.target.value } : null))
                  }
                />
              ) : (
                <p className="text-lg">{profile?.full_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-lg">{profile?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <p className="text-lg capitalize">{profile?.role}</p>
            </div>
            {editingProfile ? (
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingProfile(false);
                    loadProfileData();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button onClick={() => setEditingProfile(true)}>Editar Perfil</Button>
            )}
          </CardContent>
        </Card>

        {/* Professional Info */}
        {profile?.role === "profesional" && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Información Profesional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!professional ? (
                  <div className="text-center py-6 space-y-4">
                    <p className="text-muted-foreground">
                      Aún no has configurado tu perfil profesional
                    </p>
                    <Button 
                      onClick={() => {
                        setProfessional({
                          id: "",
                          profession: "",
                          bio: "",
                          price_per_hour: 0,
                        });
                        setEditingProfessional(true);
                      }}
                    >
                      Crear Perfil Profesional
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Profesión</Label>
                      {editingProfessional ? (
                        <Input
                          value={professional?.profession || ""}
                          onChange={(e) =>
                            setProfessional((p) =>
                              p ? { ...p, profession: e.target.value } : null
                            )
                          }
                          placeholder="Ej: Psicólogo, Abogado, Ingeniero"
                        />
                      ) : (
                        <p className="text-lg">{professional?.profession || "No especificado"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Biografía</Label>
                      {editingProfessional ? (
                        <Textarea
                          value={professional?.bio || ""}
                          onChange={(e) =>
                            setProfessional((p) => (p ? { ...p, bio: e.target.value } : null))
                          }
                          placeholder="Cuéntanos sobre tu experiencia..."
                          rows={4}
                        />
                      ) : (
                        <p className="text-muted-foreground">
                          {professional?.bio || "No especificado"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Precio por Hora
                      </Label>
                      {editingProfessional ? (
                        <Input
                          type="number"
                          value={professional?.price_per_hour || ""}
                          onChange={(e) =>
                            setProfessional((p) =>
                              p ? { ...p, price_per_hour: parseFloat(e.target.value) } : null
                            )
                          }
                        />
                      ) : (
                        <p className="text-lg font-semibold text-secondary">
                          ${professional?.price_per_hour || 0}
                        </p>
                      )}
                    </div>
                    {editingProfessional ? (
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfessional} disabled={saving}>
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingProfessional(false);
                            loadProfileData();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setEditingProfessional(true)}>
                        Editar Información Profesional
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Availability Management - Only show if professional profile exists */}
            {professional && professional.id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Gestión de Disponibilidad
                  </CardTitle>
                  <CardDescription>
                    Configura los horarios en los que puedes atender clientes
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Horarios Actuales</h3>
                  {availabilities.length === 0 ? (
                    <p className="text-muted-foreground">
                      No has configurado disponibilidad aún
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availabilities.map((avail) => (
                        <div
                          key={avail.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium capitalize">{avail.day_of_week}</p>
                            <p className="text-sm text-muted-foreground">
                              {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)} (
                              {avail.slot_duration_minutes} min por cita)
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAvailability(avail.id)}
                            className="text-destructive"
                          >
                            Eliminar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Agregar Nueva Disponibilidad</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Día</Label>
                      <Select
                        value={newAvailability.day_of_week}
                        onValueChange={(value) =>
                          setNewAvailability({ ...newAvailability, day_of_week: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duración por cita (minutos)</Label>
                      <Input
                        type="number"
                        value={newAvailability.slot_duration_minutes}
                        onChange={(e) =>
                          setNewAvailability({
                            ...newAvailability,
                            slot_duration_minutes: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Inicio</Label>
                      <Input
                        type="time"
                        value={newAvailability.start_time}
                        onChange={(e) =>
                          setNewAvailability({
                            ...newAvailability,
                            start_time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Fin</Label>
                      <Input
                        type="time"
                        value={newAvailability.end_time}
                        onChange={(e) =>
                          setNewAvailability({
                            ...newAvailability,
                            end_time: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddAvailability} className="mt-4 w-full">
                    Agregar Disponibilidad
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </>
        )}

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/mis-citas")}
            className="flex-1"
          >
            Ver Mis Citas
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/notificaciones")}
            className="flex-1"
          >
            Ver Notificaciones
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;