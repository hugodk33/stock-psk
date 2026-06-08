import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ItemForm({ params }: any) {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const itemId = params?.id;
  const isEdit = !!itemId && itemId !== "new";

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    quantity: 0,
    minQuantity: 5,
    location: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && user?.role === "WORKER") {
      navigate("/items");
      toast.error("Você não tem permissão para criar/editar itens");
    }
  }, [authLoading, user, navigate]);

  const itemQuery = trpc.items.getById.useQuery(
    { id: itemId },
    { enabled: isEdit && !!user }
  );

  const createItemMutation = trpc.items.create.useMutation({
    onSuccess: () => {
      toast.success("Item criado com sucesso");
      navigate("/items");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar item");
    },
  });

  const updateItemMutation = trpc.items.update.useMutation({
    onSuccess: () => {
      toast.success("Item atualizado com sucesso");
      navigate("/items");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar item");
    },
  });

  useEffect(() => {
    if (isEdit && itemQuery.data) {
      setFormData({
        name: itemQuery.data.name,
        category: itemQuery.data.category,
        subcategory: itemQuery.data.subcategory,
        quantity: itemQuery.data.quantity,
        minQuantity: itemQuery.data.minQuantity,
        location: itemQuery.data.location,
      });
    }
  }, [isEdit, itemQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.subcategory || !formData.location) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (isEdit) {
      updateItemMutation.mutate({
        id: itemId,
        ...formData,
      });
    } else {
      createItemMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/items")}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              {isEdit ? "Editar Item" : "Novo Item"}
            </h1>
            <p className="text-slate-600 mt-1">
              {isEdit
                ? "Atualize as informações do item"
                : "Crie um novo item no estoque"}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-8 border-0 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Item *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Parafuso M8"
                required
              />
            </div>

            {/* Categoria e Subcategoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoria *
                </label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: Parafusos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subcategoria *
                </label>
                <Input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory: e.target.value })
                  }
                  placeholder="Ex: M8"
                  required
                />
              </div>
            </div>

            {/* Localização */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Localização *
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Ex: A-01"
                required
              />
            </div>

            {/* Quantidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantidade Inicial
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantidade Mínima
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.minQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minQuantity: parseInt(e.target.value) || 5,
                    })
                  }
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/items")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isEdit ? updateItemMutation.isPending : createItemMutation.isPending
                }
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isEdit ? "Atualizar Item" : "Criar Item"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
