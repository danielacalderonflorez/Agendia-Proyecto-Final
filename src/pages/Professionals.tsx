import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const Professionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = professionals.filter(
        (prof) =>
          prof.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prof.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProfessionals(filtered);
    } else {
      setFilteredProfessionals(professionals);
    }
  }, [searchTerm, professionals]);

  const loadProfessionals = async () => {
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
        .eq("is_active", true);

      if (error) throw error;
      setProfessionals(data || []);
      setFilteredProfessionals(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los profesionales",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-['Poppins',sans-serif]">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 mt-24">
          <h1 className="text-[1.875rem] font-bold text-[#111827] mb-2">
            Profesionales Disponibles
          </h1>
          <p className="text-base text-[#4b5563]">
            Explora nuestra red de profesionales certificados
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2563eb] border-t-transparent"></div>
            <p className="mt-4 text-[#6b7280] text-base">Cargando profesionales...</p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#6b7280] text-lg">
              No se encontraron profesionales
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProfessionals.map((professional) => (
              <Card 
                key={professional.id} 
                className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(37,99,235,0.15)] border border-[#e5e7eb]"
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-[#111827] mb-1">
                    {professional.profiles?.full_name || "Profesional"}
                  </h3>
                  <p className="text-[#2563eb] font-medium text-sm mb-3">
                    {professional.profession}
                  </p>
                  <p className="text-[#4b5563] text-sm mb-3 line-clamp-2 leading-relaxed">
                    {professional.bio}
                  </p>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e5e7eb]">
                    <div className="flex items-center text-[#2563eb] font-bold text-base">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{professional.price_per_hour.toLocaleString()}/hora</span>
                    </div>
                  </div>
                  <Link
                    to={`/profesional/${professional.id}`}
                    className="w-full inline-block px-4 py-2.5 bg-[#2563eb] text-white text-center no-underline rounded-lg font-semibold text-sm transition-all duration-300 hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(37,99,235,0.3)]"
                  >
                    Ver Perfil y Agendar
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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

export default Professionals;