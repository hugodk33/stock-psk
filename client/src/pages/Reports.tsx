import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Printer, Search } from "lucide-react";

export default function Reports() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [formDateFrom, setFormDateFrom] = useState("");
  const [formDateTo, setFormDateTo] = useState("");
  const [formUserId, setFormUserId] = useState("");
  const [formItemId, setFormItemId] = useState("");

  const [queryDateFrom, setQueryDateFrom] = useState("");
  const [queryDateTo, setQueryDateTo] = useState("");
  const [queryUserId, setQueryUserId] = useState<string | undefined>();
  const [queryItemId, setQueryItemId] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const usersQuery = trpc.users.list.useQuery(undefined, {
    enabled: !!user && user?.role === "ADMIN",
  });

  const itemsQuery = trpc.items.list.useQuery(undefined, {
    enabled: !!user,
  });

  const logsQuery = trpc.logs.list.useQuery(
    {
      dateFrom: queryDateFrom,
      dateTo: queryDateTo,
      userId: queryUserId,
      itemId: queryItemId,
      limit: 1000,
    },
    { enabled: !!user }
  );

  const handleSearch = () => {
    setQueryDateFrom(formDateFrom);
    setQueryDateTo(formDateTo);
    setQueryUserId(formUserId || undefined);
    setQueryItemId(formItemId || undefined);
  };


  const logs = logsQuery.data || [];
  const users = usersQuery.data || [];
  const items = itemsQuery.data || [];

  const handlePrint = () => window.print();

  const grouped = logs.reduce<Record<string, typeof logs>>((acc, log) => {
    const date = new Date(log.createdAt).toLocaleDateString("pt-BR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8 no-print">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900">Relatórios</h1>
            <p className="text-slate-600 mt-1">Movimentações do período</p>
          </div>
          <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <div className="print-only hidden mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Relatório de Movimentações</h2>
          {queryDateFrom && queryDateTo && (
            <p className="text-slate-600">
              {new Date(queryDateFrom).toLocaleDateString("pt-BR")} — {new Date(queryDateTo).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        <Card className="p-6 border-0 shadow-sm mb-8 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Início</label>
              <input
                type="date"
                value={formDateFrom}
                onChange={(e) => setFormDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Fim</label>
              <input
                type="date"
                value={formDateTo}
                onChange={(e) => setFormDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Usuário</label>
              <select
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="">Todos</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Item</label>
              <select
                value={formItemId}
                onChange={(e) => setFormItemId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="">Todos</option>
                {items.map((item: any) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={handleSearch}
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Search className="mr-2 h-4 w-4" />
            Pesquisar
          </Button>
        </Card>

        <Card className="border-0 shadow-sm">
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">Nenhum relatório</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, dayLogs]) => (
              <div key={date}>
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">{date}</h3>
                </div>
                <div className="divide-y divide-slate-200">
                  {dayLogs.map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {log.userName && (
                            <p className="text-sm font-bold text-slate-900">[{log.userName}]</p>
                          )}
                          <p className="text-sm font-medium text-slate-900">{log.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <style>{`
        .print-only { display: none; }
        @media print {
          header, .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .min-h-screen { padding: 0 !important; }
          .max-w-5xl { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
