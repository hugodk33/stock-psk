import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";

export default function Reports() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const logsQuery = trpc.logs.list.useQuery(
    { dateFrom, dateTo, limit: 1000 },
    { enabled: !!user && !!dateFrom && !!dateTo }
  );

  const logs = logsQuery.data || [];

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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900">Relatório Diário</h1>
            <p className="text-slate-600 mt-1">Movimentações do período</p>
          </div>
          <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <Card className="p-6 border-0 shadow-sm mb-8">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Início</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Fim</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm">
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">Nenhuma movimentação no período</p>
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
                          <p className="text-sm font-medium text-slate-900">{log.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
                            {log.userName && <span className="font-semibold"> — {log.userName}</span>}
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
        @media print {
          header, .no-print { display: none !important; }
          body { background: white !important; }
          .min-h-screen { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
