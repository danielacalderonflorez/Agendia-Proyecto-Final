import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/logo.jpg";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl text-foreground hidden sm:inline">
              Agenda<span className="text-primary">Pro</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link to="/profesionales" className="text-foreground hover:text-primary transition-colors">
              Profesionales
            </Link>
            <Link to="/como-funciona" className="text-foreground hover:text-primary transition-colors">
              Cómo Funciona
            </Link>
            {user ? (
              <>
                <Link to="/perfil" className="text-foreground hover:text-primary transition-colors">
                  Mi Perfil
                </Link>
                <Link to="/mis-citas" className="text-foreground hover:text-primary transition-colors">
                  Mis Citas
                </Link>
                <Link to="/notificaciones" className="text-foreground hover:text-primary transition-colors">
                  Notificaciones
                </Link>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
                  <Link to="/registro">Registrarse</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            <Link
              to="/"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/profesionales"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profesionales
            </Link>
            <Link
              to="/como-funciona"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cómo Funciona
            </Link>
            {user ? (
              <>
                <Link
                  to="/perfil"
                  className="block px-4 py-2 text-foreground hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Perfil
                </Link>
                <Link
                  to="/mis-citas"
                  className="block px-4 py-2 text-foreground hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Citas
                </Link>
                <Link
                  to="/notificaciones"
                  className="block px-4 py-2 text-foreground hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notificaciones
                </Link>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                >
                  <Link to="/registro" onClick={() => setMobileMenuOpen(false)}>
                    Registrarse
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;