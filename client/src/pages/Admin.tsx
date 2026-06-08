import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Search } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && user && user.role !== "ADMIN") {
      navigate("/dashboard");
      toast.error("Acesso restrito a administradores");
    }
  }, [authLoading, user, navigate]);

  const usersQuery = trpc.users.list.useQuery(undefined, {
    enabled: !!user && user?.role === "ADMIN",
  });

  const logsQuery = trpc.logs.list.useQuery(
    { limit: 100 },
    {
      enabled: !!user && user?.role === "ADMIN",
    }
  );

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado com sucesso");
      usersQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar usuário");
    },
  });

  const users = usersQuery.data || [];
  const logs = logsQuery.data || [];

  const filteredUsers = users.filter((u: any) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter((log: any) =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este usuário?")) {
      deleteUserMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Administração
          </h1>
          <p className="text-slate-600">
            Gerencie usuários e visualize logs do sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Usuários
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "logs"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Logs
          </button>
        </div>

        {/* Usuários Tab */}
        {activeTab === "users" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                onClick={() => navigate("/admin/users/new")}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Nome
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Telefone
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Perfil
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {u.username}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {u.phone || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : u.role === "MANAGER"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-500">Nenhum usuário encontrado</p>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <div className="divide-y divide-slate-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {log.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {log.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-500">Nenhum log encontrado</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
