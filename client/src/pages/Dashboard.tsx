import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertCircle, Users, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    logout();
    navigate("/login");
  };

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  // Redireciona WORKER para /items
  useEffect(() => {
    if (!authLoading && user?.role === "WORKER") {
      navigate("/items");
    }
  }, [authLoading, user, navigate]);

  const itemsQuery = trpc.items.list.useQuery(undefined, {
    enabled: !!user,
  });

  const logsQuery = trpc.logs.list.useQuery(
    { limit: 10 },
    {
      enabled: !!user,
    }
  );

  // Calcula estatísticas
  const totalItems = itemsQuery.data?.length || 0;
  const lowStockItems = itemsQuery.data?.filter(
    (item) => item.quantity <= item.minQuantity
  ).length || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600">
              Bem-vindo, <span className="font-semibold">{user?.name}</span>
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2 text-slate-600"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Itens */}
          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total de Itens</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {itemsQuery.isLoading ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    totalItems
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Itens com Estoque Baixo */}
          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Estoque Baixo</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {itemsQuery.isLoading ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    lowStockItems
                  )}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>

          {/* Usuários do Sistema */}
          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Usuários</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {user?.role === "ADMIN" ? "∞" : "-"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Movimentações Recentes */}
        <Card className="border-0 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Movimentações Recentes
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {logsQuery.isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : logsQuery.data && logsQuery.data.length > 0 ? (
              logsQuery.data.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {log.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                        {log.userName && <span className="font-semibold"> — por {log.userName}</span>}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-slate-500">Nenhuma movimentação registrada</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate("/items")}
            className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            Gerenciar Itens
          </Button>
          <Button
            onClick={() => navigate("/reports")}
            className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            Relatório Diário
          </Button>
          {user?.role === "ADMIN" && (
            <Button
              onClick={() => navigate("/admin")}
              className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
            >
              Administração
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
