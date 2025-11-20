import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Professionals from "./pages/Professionals";
import HowItWorks from "./pages/HowItWorks";
import ProfessionalDetail from "./pages/ProfessionalDetail";
import Payment from "./pages/Payment";
import MyAppointments from "./pages/MyAppointments";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ProfessionalStats from "./pages/ProfessionalStats";
import ProfessionalCalendar from "./pages/ProfessionalCalendar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/profesionales" element={<Professionals />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="/profesional/:id" element={<ProfessionalDetail />} />
          <Route path="/pago" element={<Payment />} />
          <Route path="/mis-citas" element={<MyAppointments />} />
          <Route path="/notificaciones" element={<Notifications />} />
          <Route path="/chat/:appointmentId" element={<Chat />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/estadisticas" element={<ProfessionalStats />} />
          <Route path="/calendario" element={<ProfessionalCalendar />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
