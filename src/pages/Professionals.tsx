import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, DollarSign } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Encuentra tu Profesional
          </h1>
          <p className="text-muted-foreground text-lg">
            Explora nuestra red de profesionales certificados
          </p>
        </div>

        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar por profesión o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando profesionales...</p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No se encontraron profesionales
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map((professional) => (
              <Card key={professional.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                      {professional.profiles?.full_name?.charAt(0) || "P"}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {professional.profiles?.full_name || "Profesional"}
                      </CardTitle>
                      <CardDescription className="text-primary font-medium">
                        {professional.profession}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {professional.bio}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-secondary font-bold text-lg">
                      <DollarSign className="h-5 w-5 mr-1" />
                      {professional.price_per_hour}/hora
                    </div>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-primary-glow">
                    <Link to={`/profesional/${professional.id}`}>
                      Ver Perfil y Agendar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Professionals;