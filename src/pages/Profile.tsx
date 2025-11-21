"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
import Navbar from "@/components/Navbar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { User, Briefcase, DollarSign, CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

interface Professional {
  id: string
  profession: string
  bio: string
  price_per_hour: number
}

interface Availability {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

const daysOfWeek = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

const Profile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState(false)

  const [newAvailability, setNewAvailability] = useState({
    day_of_week: "lunes",
    start_time: "09:00",
    end_time: "18:00",
    slot_duration_minutes: 60,
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        navigate("/login")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      if (profileData.role === "profesional") {
        const { data: profData, error: profError } = await supabase
          .from("professionals")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        if (profError && profError.code !== "PGRST116") {
          console.error("[v0] Error loading professional data:", profError)
        }

        if (!profData) {
          console.log("[v0] No professional record found, user needs to complete profile first")
          setProfessional(null)
        } else {
          setProfessional(profData)

          if (profData) {
            const { data: availData } = await supabase
              .from("availabilities")
              .select("*")
              .eq("professional_id", profData.id)
              .eq("is_active", true)
              .order("day_of_week")

            setAvailabilities(availData || [])
          }
        }
      }
    } catch (error: any) {
      console.error("[v0] Error loading profile data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el perfil",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)

    try {
      const { error } = await supabase.from("profiles").update({ full_name: profile.full_name }).eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada",
      })
      setEditingProfile(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfessional = async () => {
    if (!profile) return
    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo obtener la sesión del usuario",
        })
        setSaving(false)
        return
      }

      if (
        !professional?.profession ||
        professional.profession === "Por definir" ||
        professional.profession.trim() === ""
      ) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa tu profesión",
        })
        setSaving(false)
        return
      }

      if (!professional?.price_per_hour || professional.price_per_hour <= 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor ingresa un precio por hora válido",
        })
        setSaving(false)
        return
      }

      if (!professional?.id) {
        console.log("[v0] Creating new professional record for user:", user.id)

        const { data, error } = await supabase
          .from("professionals")
          .insert({
            user_id: user.id,
            profession: professional.profession,
            bio: professional.bio || "Completa tu perfil para empezar a recibir citas",
            price_per_hour: professional.price_per_hour,
            is_active: true,
          })
          .select()
          .single()

        if (error) {
          console.error("[v0] Insert error:", error)
          throw error
        }

        console.log("[v0] Professional record created:", data)
        setProfessional(data)

        toast({
          title: "Perfil profesional creado",
          description: "Tu perfil ha sido activado y ahora estás visible para los clientes",
        })
      } else {
        console.log("[v0] Updating existing professional record:", professional.id)

        const { data, error } = await supabase
          .from("professionals")
          .update({
            profession: professional.profession,
            bio: professional.bio,
            price_per_hour: professional.price_per_hour,
            is_active: true,
          })
          .eq("id", professional.id)
          .select()

        if (error) {
          console.error("[v0] Update error:", error)
          throw error
        }

        console.log("[v0] Professional record updated:", data)

        toast({
          title: "Datos profesionales actualizados",
          description: "Tu perfil ha sido actualizado correctamente",
        })
      }

      setEditingProfessional(false)
      loadProfileData()
    } catch (error: any) {
      console.error("[v0] Save professional error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudieron guardar los datos profesionales: ${error.message}`,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddAvailability = async () => {
    if (!professional) return

    try {
      const { error } = await supabase.from("availabilities").insert([
        {
          professional_id: professional.id,
          day_of_week: newAvailability.day_of_week as any,
          start_time: `${newAvailability.start_time}:00`,
          end_time: `${newAvailability.end_time}:00`,
          slot_duration_minutes: newAvailability.slot_duration_minutes,
        },
      ])

      if (error) throw error

      toast({
        title: "Disponibilidad agregada",
        description: "Tu horario ha sido actualizado",
      })

      loadProfileData()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la disponibilidad",
      })
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase.from("availabilities").update({ is_active: false }).eq("id", id)

      if (error) throw error

      toast({
        title: "Disponibilidad eliminada",
        description: "El horario ha sido removido",
      })

      setAvailabilities((current) => current.filter((a) => a.id !== id))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la disponibilidad",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <h1 className="text-[1.875rem] font-bold mb-8 text-gray-900 mt-24">Mi Perfil</h1>

        {/* Basic Profile */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
              {editingProfile ? (
                <Input
                  value={profile?.full_name || ""}
                  onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : null))}
                  className="border-gray-200"
                />
              ) : (
                <p className="text-base text-gray-900">{profile?.full_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-base text-gray-900">{profile?.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rol</label>
              <p className="text-base text-gray-900 capitalize">{profile?.role}</p>
            </div>
            {editingProfile ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all duration-300"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditingProfile(false)
                    loadProfileData()
                  }}
                  className="px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingProfile(true)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all duration-300"
              >
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* Professional Info */}
        {profile?.role === "profesional" && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Información Profesional
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {!professional ? (
                  <div className="text-center py-6 space-y-4">
                    <p className="text-[#6b7280]">Aún no has configurado tu perfil profesional</p>
                    <button
                      onClick={() => {
                        setProfessional({
                          id: "",
                          profession: "",
                          bio: "",
                          price_per_hour: 0,
                        })
                        setEditingProfessional(true)
                      }}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all duration-300"
                    >
                      Crear Perfil Profesional
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Profesión</label>
                      {editingProfessional ? (
                        <Input
                          value={professional?.profession || ""}
                          onChange={(e) => setProfessional((p) => (p ? { ...p, profession: e.target.value } : null))}
                          placeholder="Ej: Psicólogo, Abogado, Ingeniero"
                          className="border-gray-200"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{professional?.profession || "No especificado"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Biografía</label>
                      {editingProfessional ? (
                        <Textarea
                          value={professional?.bio || ""}
                          onChange={(e) => setProfessional((p) => (p ? { ...p, bio: e.target.value } : null))}
                          placeholder="Cuéntanos sobre tu experiencia..."
                          rows={4}
                          className="border-gray-200"
                        />
                      ) : (
                        <p className="text-[#6b7280] text-sm">{professional?.bio || "No especificado"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Precio por Hora
                      </label>
                      {editingProfessional ? (
                        <Input
                          type="number"
                          value={professional?.price_per_hour || ""}
                          onChange={(e) =>
                            setProfessional((p) =>
                              p ? { ...p, price_per_hour: Number.parseFloat(e.target.value) } : null,
                            )
                          }
                          className="border-gray-200"
                        />
                      ) : (
                        <p className="text-base font-bold text-blue-600">${professional?.price_per_hour || 0}</p>
                      )}
                    </div>
                    {editingProfessional ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveProfessional}
                          disabled={saving}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all duration-300"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingProfessional(false)
                            loadProfileData()
                          }}
                          className="px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all duration-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingProfessional(true)}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all duration-300"
                      >
                        Editar Información Profesional
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Access */}
            {professional && professional.id && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Accesos Rápidos</h2>
                  <p className="text-sm text-[#6b7280] mt-1">Gestiona tus citas y revisa tu rendimiento</p>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      onClick={() => navigate("/calendario")}
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      <CalendarIcon className="h-8 w-8 text-blue-600" />
                      <span className="font-semibold text-gray-900">Mi Calendario</span>
                      <span className="text-xs text-[#6b7280]">Vista de citas programadas</span>
                    </button>
                    <button
                      onClick={() => navigate("/estadisticas")}
                      className="h-24 flex flex-col items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      <Briefcase className="h-8 w-8 text-blue-600" />
                      <span className="font-semibold text-gray-900">Estadísticas</span>
                      <span className="text-xs text-[#6b7280]">Analiza tu rendimiento</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Management */}
            {professional && professional.id && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-6">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Gestión de Disponibilidad
                  </h2>
                  <p className="text-sm text-[#6b7280] mt-1">
                    Configura los horarios en los que puedes atender clientes
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Horarios Actuales</h3>
                    {availabilities.length === 0 ? (
                      <p className="text-[#6b7280]">No has configurado disponibilidad aún</p>
                    ) : (
                      <div className="space-y-2">
                        {availabilities.map((avail) => (
                          <div
                            key={avail.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{avail.day_of_week}</p>
                              <p className="text-sm text-[#6b7280]">
                                {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)} (
                                {avail.slot_duration_minutes} min por cita)
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteAvailability(avail.id)}
                              className="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-all duration-300"
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Agregar Nueva Disponibilidad</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Día</label>
                        <Select
                          value={newAvailability.day_of_week}
                          onValueChange={(value) => setNewAvailability({ ...newAvailability, day_of_week: value })}
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
                        <label className="text-sm font-medium text-gray-700">Duración por cita (minutos)</label>
                        <Input
                          type="number"
                          value={newAvailability.slot_duration_minutes}
                          onChange={(e) =>
                            setNewAvailability({
                              ...newAvailability,
                              slot_duration_minutes: Number.parseInt(e.target.value),
                            })
                          }
                          className="border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Hora Inicio</label>
                        <Input
                          type="time"
                          value={newAvailability.start_time}
                          onChange={(e) =>
                            setNewAvailability({
                              ...newAvailability,
                              start_time: e.target.value,
                            })
                          }
                          className="border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Hora Fin</label>
                        <Input
                          type="time"
                          value={newAvailability.end_time}
                          onChange={(e) =>
                            setNewAvailability({
                              ...newAvailability,
                              end_time: e.target.value,
                            })
                          }
                          className="border-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAddAvailability}
                      className="mt-4 w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all duration-300"
                    >
                      Agregar Disponibilidad
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => navigate("/mis-citas")}
            className="flex-1 px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all duration-300"
          >
            Ver Mis Citas
          </button>
          <button
            onClick={() => navigate("/notificaciones")}
            className="flex-1 px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all duration-300"
          >
            Ver Notificaciones
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
