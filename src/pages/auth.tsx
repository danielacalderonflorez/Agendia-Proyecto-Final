"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, User, Briefcase } from "lucide-react"
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"login" | "registro">("login")
  const [loading, setLoading] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "cliente" as "cliente" | "profesional",
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) throw error

      if (data.user) {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        })
        navigate("/")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Por favor verifica tus credenciales",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error

      if (data.user) {
        toast({
          title: "¡Registro exitoso!",
          description:
            formData.role === "profesional"
              ? "Tu cuenta ha sido creada. Completa tu perfil profesional para activar tu cuenta"
              : "Tu cuenta ha sido creada correctamente",
        })

        navigate(formData.role === "profesional" ? "/perfil" : "/")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message || "Por favor intenta nuevamente",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Branding Section */}
      <div className="auth-branding">
        <div className="branding-overlay"></div>
        <div className="branding-contenido">
          <div className="logo-section">
            <img src={logo} alt="Logo" className="h-20 w-20 object-contain" />
            <h1>Agendia</h1>
            <p className="subtitulo">Tu red profesional</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="auth-form-container">
        <div className="form-wrapper">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Iniciar Sesión
            </button>
            <button
              className={`tab-btn ${activeTab === "registro" ? "active" : ""}`}
              onClick={() => setActiveTab("registro")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Registrarse
            </button>
          </div>

          {/* Login Form */}
          <div className={`form-content ${activeTab === "login" ? "active" : ""}`}>
            <div className="form-header">
              <h2>Inicia Sesión</h2>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <div className="password-input">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="boton" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>
          </div>

          {/* Register Form */}
          <div className={`form-content ${activeTab === "registro" ? "active" : ""}`}>
            <div className="form-header">
              <h2>Regístrate</h2>
            </div>

            <div className="form-group">
              <label>Tipo de Usuario</label>
              <div className="tipo-usuario-group">
                <label className="radio-card">
                  <input
                    type="radio"
                    name="tipo-usuario"
                    value="cliente"
                    checked={formData.role === "cliente"}
                    onChange={(e) => setFormData({ ...formData, role: "cliente" })}
                    disabled={loading}
                  />
                  <div className="radio-content">
                    <User size={32} />
                    <span>Cliente</span>
                  </div>
                </label>
                <label className="radio-card">
                  <input
                    type="radio"
                    name="tipo-usuario"
                    value="profesional"
                    checked={formData.role === "profesional"}
                    onChange={(e) => setFormData({ ...formData, role: "profesional" })}
                    disabled={loading}
                  />
                  <div className="radio-content">
                    <Briefcase size={32} />
                    <span>Profesional</span>
                  </div>
                </label>
              </div>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Nombre Completo"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <div className="password-input">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  >
                    {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmar Contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="boton" disabled={loading}>
                {loading ? "Registrando..." : "Registrarse"}
              </button>
            </form>

            <div className="volver-inicio">
              <Link to="/">Volver al inicio</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-container {
          display: grid;
          grid-template-columns: 45% 55%;
          min-height: 100vh;
        }

        .auth-branding {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .branding-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 50%);
          pointer-events: none;
        }

        .branding-contenido {
          position: relative;
          z-index: 1;
          color: white;
          text-align: center;
          max-width: 500px;
        }

        .logo-section {
          margin-bottom: 50px;
        }

        .logo-grande {
          width: 120px;
          height: 120px;
          margin-bottom: 20px;
          border-radius: 20px;
        }

        .logo-section h1 {
          font-size: 48px;
          color: #2563eb;
          margin-bottom: 10px;
          letter-spacing: 2px;
          font-weight: 700;
        }

        .logo-section .subtitulo {
          font-size: 18px;
          color: #e5e7eb;
          letter-spacing: 4px;
          text-transform: uppercase;
          opacity: 0.9;
        }

        .auth-form-container {
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          overflow-y: auto;
        }

        .form-wrapper {
          width: 100%;
          max-width: 480px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 35px;
          background: #f9fafb;
          padding: 6px;
          border-radius: 10px;
        }

        .tab-btn {
          flex: 1;
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tab-btn:hover {
          color: #2563eb;
        }

        .tab-btn.active {
          background: #2563eb;
          color: white;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .form-content {
          display: none;
          animation: fadeIn 0.3s ease;
        }

        .form-content.active {
          display: block;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-header {
          margin-bottom: 30px;
        }

        .form-header h2 {
          font-size: 32px;
          color: #111827;
          margin-bottom: 10px;
          text-align: center;
          font-weight: 700;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .form-group input[type="text"],
        .form-group input[type="email"],
        .form-group input[type="password"] {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 15px;
          color: #111827;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-group input::placeholder {
          color: #9ca3af;
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .password-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input input {
          flex: 1;
          padding-right: 45px;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 5px;
          font-size: 16px;
          transition: color 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-password:hover {
          color: #2563eb;
        }

        .tipo-usuario-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 8px;
        }

        .radio-card {
          position: relative;
          cursor: pointer;
        }

        .radio-card input[type="radio"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .radio-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          background: white;
          transition: all 0.3s ease;
          text-align: center;
          gap: 8px;
        }

        .radio-content svg {
          color: #6b7280;
          transition: color 0.3s ease;
        }

        .radio-content span {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
        }

        .radio-card input[type="radio"]:checked + .radio-content {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .radio-card input[type="radio"]:checked + .radio-content svg {
          color: #2563eb;
        }

        .radio-card:hover .radio-content {
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .boton {
          width: 100%;
          padding: 14px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .boton:hover:not(:disabled) {
          background-color: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(37, 99, 235, 0.3);
        }

        .boton:active:not(:disabled) {
          transform: translateY(0);
        }

        .boton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .volver-inicio {
          text-align: center;
          margin-top: 20px;
        }

        .volver-inicio a {
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s ease;
        }

        .volver-inicio a:hover {
          color: #2563eb;
        }

        @media (max-width: 1024px) {
          .auth-container {
            grid-template-columns: 1fr;
          }

          .auth-branding {
            display: none;
          }

          .auth-form-container {
            padding: 20px;
          }
        }

        @media (max-width: 640px) {
          .form-header h2 {
            font-size: 26px;
          }

          .tipo-usuario-group {
            grid-template-columns: 1fr;
          }

          .tabs {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}

export default Auth
