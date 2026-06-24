import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Package, FileText } from "lucide-react";
import logoFull from "@/assets/logo-full.78474cf02e1ffab05103.png";

export default function Header() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/login");
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-center gap-3 px-8 py-4">
        <img src={logoFull} alt="Logo" className="h-10 w-auto" />
        <span className="text-xl font-bold text-slate-900">Estoque</span>
      </div>

      {user && (
        <div className="flex items-center justify-center gap-2 px-8 pb-3 flex-wrap">
          {user?.role !== "WORKER" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-slate-600 hover:text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/reports")}
                className="text-slate-600 hover:text-slate-900"
              >
                <FileText className="h-4 w-4 mr-1" />
                Relatórios
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/items")}
            className="text-slate-600 hover:text-slate-900"
          >
            <Package className="h-4 w-4 mr-1" />
            Gerenciar Itens
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      )}
    </div>
  );
}
