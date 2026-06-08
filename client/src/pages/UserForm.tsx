import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function UserForm() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    password: "",
    role: "WORKER" as "ADMIN" | "MANAGER" | "WORKER",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && user?.role !== "ADMIN") {
      navigate("/admin");
      toast.error("Você não tem permissão para gerenciar usuários");
    }
  }, [authLoading, user, navigate]);

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");
      navigate("/admin");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.username || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createUserMutation.mutate({
      name: formData.name,
      username: formData.username,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Novo Usuário
            </h1>
            <p className="text-slate-600 mt-1">
              Crie um novo usuário no sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-8 border-0 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Completo *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: João Silva"
                required
              />
            </div>

            {/* Usuário */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome de Usuário *
              </label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Ex: joao.silva"
                required
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Ex: 11999999999"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Digite a senha"
                required
              />
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Perfil *
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "ADMIN" | "MANAGER" | "WORKER",
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              >
                <option value="WORKER">Worker (Operador)</option>
                <option value="MANAGER">Manager (Gerente)</option>
                <option value="ADMIN">Admin (Administrador)</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              >
                Criar Usuário
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
