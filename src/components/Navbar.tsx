import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/logo.png";
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
    <nav className="w-full h-[60px] fixed top-0 left-0 z-50 bg-white shadow-[0_2px_5px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
          <span className="font-semibold text-lg text-[#111827] hidden sm:inline">
            Agenda<span className="text-[#2563eb]">Día</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className="text-[#4b5563] text-base hover:text-[#2563eb] transition-colors"
          >
            Inicio
          </Link>
          <Link 
            to="/profesionales" 
            className="text-[#4b5563] text-base hover:text-[#2563eb] transition-colors"
          >
            Profesionales
          </Link>
          
          {user && (
            <>
              <Link 
                to="/perfil" 
                className="text-[#4b5563] text-base hover:text-[#2563eb] transition-colors"
              >
                Mi Perfil
              </Link>
              <Link 
                to="/mis-citas" 
                className="text-[#4b5563] text-base hover:text-[#2563eb] transition-colors"
              >
                Mis Citas
              </Link>
              <Link 
                to="/notificaciones" 
                className="text-[#4b5563] text-base hover:text-[#2563eb] transition-colors"
              >
                Notificaciones
              </Link>
            </>
          )}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-[#374151] rounded-md border-none px-5 py-2.5 text-center text-[#ecf0f1] text-sm font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer hover:bg-transparent hover:border hover:border-[#374151] hover:text-[#374151]"
            >
              Cerrar Sesión
            </button>
          ) : (
            <>
              <Link
                to="/auth"
                className="bg-[#374151] rounded-md border-none px-5 py-2.5 text-center no-underline text-[#ecf0f1] text-sm font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer hover:bg-transparent hover:border hover:border-[#374151] hover:text-[#374151]"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/auth"
                className="bg-[#374151] rounded-md border-none px-5 py-2.5 text-center no-underline text-[#ecf0f1] text-sm font-['Poppins',sans-serif] transition-all duration-300 cursor-pointer hover:bg-transparent hover:border hover:border-[#374151] hover:text-[#374151]"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-[#4b5563]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[60px] left-0 w-full bg-white shadow-lg border-t border-[#e5e7eb]">
          <div className="py-4 space-y-2 px-4">
            <Link
              to="/"
              className="block px-4 py-3 text-[#4b5563] hover:bg-[#f9fafb] rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/profesionales"
              className="block px-4 py-3 text-[#4b5563] hover:bg-[#f9fafb] rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profesionales
            </Link>
            <Link
              to="/como-funciona"
              className="block px-4 py-3 text-[#4b5563] hover:bg-[#f9fafb] rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cómo Funciona
            </Link>
            {user ? (
              <>
                <Link
                  to="/perfil"
                  className="block px-4 py-3 text-[#4b5563] hover:bg-[#f9fafb] rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Perfil
                </Link>
                <Link
                  to="/mis-citas"
                  className="block px-4 py-3 text-[#4b5563] hover:bg-[#f9fafb] rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis Citas
                </Link>
                <Link
                  to="/notificaciones"
                  className="block px-4 py-3 text-[#4b5563] hover:bg-[#f9fafb] rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notificaciones
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full bg-[#374151] rounded-md px-5 py-2.5 text-[#ecf0f1] text-sm font-['Poppins',sans-serif] transition-all duration-300 mt-2"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block w-full bg-[#374151] rounded-md px-5 py-2.5 text-center text-[#ecf0f1] text-sm font-['Poppins',sans-serif] transition-all duration-300 mt-2 no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/registro"
                  className="block w-full bg-[#374151] rounded-md px-5 py-2.5 text-center text-[#ecf0f1] text-sm font-['Poppins',sans-serif] transition-all duration-300 mt-2 no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;