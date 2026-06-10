import logoFull from "@/assets/logo-full.78474cf02e1ffab05103.png";

export default function Header() {
  return (
    <div className="flex items-center gap-3 px-8 py-4 border-b border-slate-200 bg-white">
      <img src={logoFull} alt="Logo" className="h-10 w-auto" />
      <span className="text-2xl font-bold text-slate-900">Gestão de Estoque</span>
    </div>
  );
}
