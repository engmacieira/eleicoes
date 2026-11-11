import React from 'react';
import { Database, Server, Code, FileText, CheckCircle2, BarChart3, Layers, Download, Vote, User } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadAllSql: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onDownloadAllSql }) => {
  const navItems = [
    { id: 'pleito', label: 'Visão Geral do Pleito', icon: Vote },
    { id: 'dossie', label: 'Dossiê do Político', icon: User },
    { id: 'partidos', label: 'Raio-X Partidário', icon: BarChart3 },
    { id: 'backend', label: 'FastAPI & Cloud SQL', icon: Server },
    { id: 'schema', label: 'Schema DDL & ER', icon: Layers },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-lg tracking-tight">Cloud SQL Architect</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                  PostgreSQL 15+
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 hidden sm:inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> TSE 2000-2024
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Modelagem Relacional de Eleições Municipais (Braúnas - MG)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onDownloadAllSql}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
              title="Baixar pacote completo com DDL, Índices e Dados de Carga"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exportar SQL Completo (.sql)</span>
              <span className="md:hidden">Exportar SQL</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex overflow-x-auto space-x-1 py-2 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
