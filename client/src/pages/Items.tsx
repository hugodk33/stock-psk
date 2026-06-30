import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QRCodeCanvas } from "qrcode.react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Plus, Search, Scan, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function Items() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrViewItem, setQrViewItem] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const handleScan = async () => {
    setScannerOpen(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText: string) => {
        const match = decodedText.match(/\/items\/([^/]+)$/);
        if (match) {
          scanner.stop().catch(() => {});
          setScannerOpen(false);
          navigate(`/items/${match[1]}`);
        } else {
          toast.error("QR Code inválido");
        }
      },
      () => {}
    ).catch(() => {
      toast.error("Erro ao acessar câmera");
      setScannerOpen(false);
    });
  };

  const closeScanner = () => {
    setScannerOpen(false);
  };

  const itemsQuery = trpc.items.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteItemMutation = trpc.items.delete.useMutation({
    onSuccess: () => {
      toast.success("Item deletado com sucesso");
      itemsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar item");
    },
  });

  const items = itemsQuery.data || [];

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(items.map((item: any) => item.category)));

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este item?")) {
      deleteItemMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Gestão de Itens
            </h1>
            <p className="text-slate-600">
              Gerencie todos os itens do seu estoque
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleScan}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              Escanear QR Code
            </Button>
            {user?.role !== "WORKER" && (
              <Button
                onClick={() => navigate("/items/new")}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Item
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-6 mb-8 border-0 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Buscar por nome
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Tabela de Itens */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Categoria
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Localização
                  </th>
                  {user?.role !== "WORKER" && (
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Quantidade
                    </th>
                  )}
                  {user?.role !== "WORKER" && (
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Mínimo
                    </th>
                  )}
                  {user?.role !== "WORKER" && (
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Status
                    </th>
                  )}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                    QR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item: any) => {
                  const isLowStock = item.quantity <= item.minQuantity;
                  return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/items/${item.id}`)}
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded border border-slate-200"
                          />
                        )}
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.location}
                    </td>
                    {user?.role !== "WORKER" && (
                      <td className="px-6 py-4 text-sm text-slate-900 text-center font-medium">
                        {item.quantity}
                      </td>
                    )}
                    {user?.role !== "WORKER" && (
                      <td className="px-6 py-4 text-sm text-slate-600 text-center">
                        {item.minQuantity}
                      </td>
                    )}
                    {user?.role !== "WORKER" && (
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isLowStock
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isLowStock ? "Baixo" : "Normal"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setQrViewItem(item.id); }}
                        className="text-slate-400 hover:text-slate-900"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-slate-500">Nenhum item encontrado</p>
            </div>
          )}
        </Card>

        {qrViewItem && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setQrViewItem(null)}>
            <div className="bg-white rounded-xl p-6 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">QR Code</h2>
                <Button variant="ghost" size="sm" onClick={() => setQrViewItem(null)}>Fechar</Button>
              </div>
              <div className="flex justify-center">
                {typeof window !== "undefined" && (
                  <QRCodeCanvas value={`${window.location.origin}/items/${qrViewItem}`} size={200} />
                )}
              </div>
            </div>
          </div>
        )}

        {scannerOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Escanear QR Code</h2>
                <Button variant="ghost" size="sm" onClick={closeScanner}>Fechar</Button>
              </div>
              <div id="qr-reader" className="w-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
