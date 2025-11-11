import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Categoria from "./pages/Categoria";
import Produto from "./pages/Produto";
import Sobre from "./pages/Sobre";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Produtos from "./pages/admin/Produtos";
import Pedidos from "./pages/admin/Pedidos";
import Clientes from "./pages/admin/Clientes";
import Slides from "./pages/admin/Slides";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categoria/:categoria" element={<Categoria />} />
          <Route path="/produto/:handle" element={<Produto />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/produtos" element={<AdminRoute><Produtos /></AdminRoute>} />
          <Route path="/admin/pedidos" element={<AdminRoute><Pedidos /></AdminRoute>} />
          <Route path="/admin/clientes" element={<AdminRoute><Clientes /></AdminRoute>} />
          <Route path="/admin/slides" element={<AdminRoute><Slides /></AdminRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
