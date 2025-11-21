import { Link } from "react-router-dom"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#1f2937] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-[#2563eb] mb-4">Agendia</h3>
            <p className="text-[#d1d5db]">
              La plataforma que conecta profesionales con clientes de manera fácil y segura.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/profesionales" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                  Profesionales
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                  Cómo Funciona
                </Link>
              </li>
              <li>
                <Link to="/registro" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacidad" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                  Términos
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-[#d1d5db] hover:text-[#2563eb] transition-colors">
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#374151] text-center text-[#d1d5db]">
          <p>&copy; {new Date().getFullYear()} Agendia. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
