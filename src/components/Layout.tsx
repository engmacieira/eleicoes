import React, { useState } from 'react';
import {
  Vote,
  Users,
  BarChart3,
  Database,
  Server,
  Layers,
  Download,
  Menu,
  X,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  UserCheck,
  Network,
  Calculator,
} from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadAllSql: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  setActiveTab,
  onDownloadAllSql,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems = [
    {
      id: 'pleito',
      label: 'Visão Geral do Pleito',
      icon: Vote,
      badge: '2000-2024',
    },
    {
      id: 'partidos',
      label: 'Raio-X Partidário',
      icon: BarChart3,
      badge: 'Legenda x Nominal',
    },
    {
      id: 'coligacoes',
      label: 'Coligações Partidárias',
      icon: Network,
      badge: 'Alianças & Apoios',
    },
    {
      id: 'quociente',
      label: 'Quociente Eleitoral (Vereador)',
      icon: Calculator,
      badge: 'QE / QP / Sobras',
    },
    {
      id: 'dossie',
      label: 'Dossiê de Candidatos',
      icon: Users,
      badge: 'Pessoas Físicas',
    },
    {
      id: 'cadastros',
      label: 'Gestão de Cadastros',
      icon: UserCheck,
      badge: 'CRUD',
    },
  ];

  const infraNavItems = [
    {
      id: 'sql_explorer',
      label: 'Explorador SQL & Schema',
      icon: Database,
      badge: 'DDL & Views',
    },
    {
      id: 'infra_config',
      label: 'Configuração & Cloud SQL',
      icon: Server,
      badge: 'FastAPI & GCP',
    },
  ];

  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'pleito':
        return { context: 'Inteligência Eleitoral', section: 'Visão Geral do Pleito' };
      case 'partidos':
        return { context: 'Inteligência Eleitoral', section: 'Raio-X Partidário' };
      case 'coligacoes':
        return { context: 'Inteligência Eleitoral', section: 'Coligações Partidárias' };
      case 'quociente':
        return { context: 'Inteligência Eleitoral', section: 'Quociente Eleitoral (Vereador)' };
      case 'dossie':
        return { context: 'Inteligência Eleitoral', section: 'Dossiê de Candidatos' };
      case 'candidato':
        return { context: 'Inteligência Eleitoral', section: 'Perfil e Dossiê Individual' };
      case 'cadastros':
        return { context: 'Administração', section: 'Gestão de Cadastros' };
      case 'sql_explorer':
        return { context: 'Infraestrutura & SQL', section: 'Explorador SQL & Schema' };
      case 'infra_config':
        return { context: 'Infraestrutura & SQL', section: 'Configuração & Cloud SQL' };
      default:
        return { context: 'Eleições Braúnas', section: 'Painel Executivo' };
    }
  };

  const breadcrumb = getBreadcrumbLabel();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed Lateral Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between transform transition-transform duration-250 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-xs">
                <Vote className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                  Eleições Braúnas
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Inteligência Eleitoral & Cloud SQL
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-6">
            {/* Context 1: Inteligência Eleitoral */}
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Inteligência Eleitoral
              </div>
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`}
                        />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive ? 'text-blue-700 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Context 2: Engenharia & Banco de Dados */}
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Infraestrutura & SQL
              </div>
              <nav className="space-y-1">
                {infraNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`}
                        />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive ? 'text-blue-700 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Cloud SQL Instance Status Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={() => {
              setActiveTab('infra_config');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-3 rounded-lg bg-white border border-slate-200/80 hover:border-blue-400 transition cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                GCP Cloud SQL
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ativo
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-800 group-hover:text-blue-700 transition">
              34.95.135.110:5432
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>PostgreSQL 15</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Gerenciar</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between shadow-2xs">
          {/* Left Zone: Hamburger for Mobile & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">
                {breadcrumb.context}
              </span>
              <span className="text-slate-400 hidden sm:inline">/</span>
              <span className="text-slate-900 font-bold tracking-tight">
                {breadcrumb.section}
              </span>
            </div>
          </div>

          {/* Right Zone: Database Status Badge & Export Action */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Clickable Cloud SQL Status Badge */}
            <button
              onClick={() => setActiveTab('infra_config')}
              className="inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/80 transition cursor-pointer"
              title="Instância Google Cloud SQL Online (Clique para abrir configuração)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold hidden sm:inline">Cloud SQL Conectado</span>
              <span className="sm:hidden font-semibold">Postgres</span>
            </button>

            {/* Export SQL Package Button */}
            <button
              onClick={onDownloadAllSql}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              title="Baixar pacote completo: DDL, Índices, Views e Carga Histórica"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar SQL Completo</span>
              <span className="sm:hidden">Exportar</span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Institutional Clean Civic Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Série Histórica Eleições Municipais (2000–2024) • Braúnas / MG</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
              <span>GCP Cloud SQL</span>
              <span>·</span>
              <span>FastAPI (Python)</span>
              <span>·</span>
              <span>React 19 & Tailwind CSS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
