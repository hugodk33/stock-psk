import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Routes() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const routesQuery = trpc.routes.list.useQuery(undefined, {
    enabled: !!user,
  });

  const confirmRouteMutation = trpc.routes.confirm.useMutation({
    onSuccess: () => {
      toast.success("Rota confirmada com sucesso");
      routesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao confirmar rota");
    },
  });

  const cancelRouteMutation = trpc.routes.cancel.useMutation({
    onSuccess: () => {
      toast.success("Rota cancelada com sucesso");
      routesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cancelar rota");
    },
  });

  const routes = routesQuery.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Gestão de Rotas
            </h1>
            <p className="text-slate-600">
              Gerencie rotas de despacho e movimentação de itens
            </p>
          </div>
          {user?.role !== "WORKER" && (
            <Button
              onClick={() => navigate("/routes/new")}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Rota
            </Button>
          )}
        </div>

        {/* Rotas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route: any) => (
            <Card
              key={route.id}
              className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/routes/${route.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {route.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(route.scheduledDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    route.status
                  )}`}
                >
                  {getStatusIcon(route.status)}
                  {route.status === "PENDING"
                    ? "Pendente"
                    : route.status === "IN_PROGRESS"
                    ? "Em Andamento"
                    : route.status === "COMPLETED"
                    ? "Concluída"
                    : "Cancelada"}
                </span>
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Criada por:</span> {route.createdBy}
                </p>
              </div>

              {user?.role !== "WORKER" && route.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmRouteMutation.mutate({ id: route.id });
                    }}
                    disabled={confirmRouteMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    Confirmar
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelRouteMutation.mutate({ id: route.id });
                    }}
                    disabled={cancelRouteMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {routes.length === 0 && (
          <Card className="p-12 border-0 shadow-sm text-center">
            <p className="text-slate-500 mb-4">Nenhuma rota encontrada</p>
            {user?.role !== "WORKER" && (
              <Button
                onClick={() => navigate("/routes/new")}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Rota
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
