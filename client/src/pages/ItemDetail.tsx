import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function ItemDetail({ params }: any) {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const itemId = params.id;
  const [quantity, setQuantity] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const itemQuery = trpc.items.getById.useQuery(
    { id: itemId },
    { enabled: !!user && !!itemId }
  );

  const logsQuery = trpc.logs.list.useQuery(
    { itemId, limit: 20 },
    { enabled: !!user && !!itemId }
  );

  const addStockMutation = trpc.items.addStock.useMutation({
    onSuccess: () => {
      toast.success("Entrada registrada com sucesso");
      itemQuery.refetch();
      logsQuery.refetch();
      setQuantity(1);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar entrada");
    },
  });

  const removeStockMutation = trpc.items.removeStock.useMutation({
    onSuccess: () => {
      toast.success("Saída registrada com sucesso");
      itemQuery.refetch();
      logsQuery.refetch();
      setQuantity(1);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar saída");
    },
  });

  const item = itemQuery.data;
  const logs = logsQuery.data || [];
  const isLowStock = item && item.quantity <= item.minQuantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="max-w-4xl mx-auto p-8">
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
              {item?.name || "Carregando..."}
            </h1>
            <p className="text-slate-600 mt-1">
              Detalhes e movimentações do item
            </p>
          </div>
          {user?.role !== "WORKER" && (
            <Button
              onClick={() => navigate(`/items/${itemId}/edit`)}
              variant="outline"
              className="ml-auto"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>

        {/* Item Info */}
        {item && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Informações Básicas */}
              <Card className="p-6 border-0 shadow-sm md:col-span-2">
                <div className="flex gap-6">
                  {item.imageUrl && (
                    <div className="shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-40 h-40 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                      Informações Básicas
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Categoria</p>
                        <p className="text-slate-900 mt-1">{item.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Subcategoria</p>
                        <p className="text-slate-900 mt-1">{item.subcategory}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Localização</p>
                        <p className="text-slate-900 mt-1">{item.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

{user?.role !== "WORKER" && (
                <Card className="p-6 border-0 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Status do Estoque
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Quantidade</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {item.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Mínimo</p>
                      <p className="text-slate-900 mt-1">{item.minQuantity}</p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isLowStock
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {isLowStock ? "Estoque Baixo" : "Estoque Normal"}
                      </span>
                    </div>
                  </div>
                </Card>
)}
            </div>

            <Card className="p-6 border-0 shadow-sm mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Movimentações Avulsas
              </h2>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  {user?.role !== "WORKER" && (
                    <Button
                      onClick={() => {
                        setConfirmAction("add");
                        setConfirmOpen(true);
                      }}
                      disabled={addStockMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Entrada
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setConfirmAction("remove");
                      setConfirmOpen(true);
                    }}
                    disabled={removeStockMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Minus className="mr-2 h-4 w-4" />
                    Saída
                  </Button>
                </div>
              </div>
            </Card>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {confirmAction === "add" ? "Confirmar Entrada" : "Confirmar Saída"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {confirmAction === "add"
                      ? `Adicionar ${quantity} unidade(s) de "${item?.name}" ao estoque?`
                      : `Despachar ${quantity} unidade(s) de "${item?.name}" do estoque?`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (confirmAction === "add") {
                        addStockMutation.mutate({ itemId, quantity });
                      } else if (confirmAction === "remove") {
                        removeStockMutation.mutate({ itemId, quantity });
                      }
                    }}
                    className={confirmAction === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  >
                    {confirmAction === "add" ? "Confirmar Entrada" : "Confirmar Saída"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Histórico de Movimentações */}
            <Card className="border-0 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Histórico de Movimentações
                </h2>
              </div>

              <div className="divide-y divide-slate-200">
                {logs.length > 0 ? (
                  logs.map((log: any) => (
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
          </>
        )}
      </div>
    </div>
  );
}
