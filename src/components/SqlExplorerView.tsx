import React, { useState } from 'react';
import { AnalyticsQueries } from './AnalyticsQueries';
import { SchemaDiagram } from './SchemaDiagram';
import { DdlViewer } from './DdlViewer';
import { IndexesViewer } from './IndexesViewer';
import {
  Layers,
  BarChart3,
  FileCode2,
  Zap,
  Database,
  ExternalLink,
} from 'lucide-react';

interface SqlExplorerViewProps {
  initialTab?: 'queries' | 'diagram' | 'ddl' | 'indexes';
}

export const SqlExplorerView: React.FC<SqlExplorerViewProps> = ({
  initialTab = 'queries',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queries' | 'diagram' | 'ddl' | 'indexes'>(initialTab);

  const tabs = [
    {
      id: 'queries' as const,
      label: 'Consultas Analíticas & BI',
      icon: BarChart3,
      desc: 'Queries SQL otimizadas para rankings, bancadas e transição',
    },
    {
      id: 'diagram' as const,
      label: 'Diagrama ER & Modelagem',
      icon: Layers,
      desc: 'Relacionamentos 1:N, PKs, FKs e cardinalidade 3FN',
    },
    {
      id: 'ddl' as const,
      label: 'Script DDL das Tabelas',
      icon: FileCode2,
      desc: 'Criação estrutural com constraints e ordem determinística',
    },
    {
      id: 'indexes' as const,
      label: 'Estratégia de Índices',
      icon: Zap,
      desc: 'B-Tree compostos para eliminação de Seq Scan e Sort',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Context Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700 mb-1">
              <span className="uppercase tracking-wider">Engenharia de Dados • PostgreSQL 15</span>
              <span>·</span>
              <span className="text-slate-500">Google Cloud SQL</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-600" />
              <span>Explorador SQL & Schema Relacional</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Modelagem formal em Terceira Forma Normal (3FN), DDL executável, índices estratégicos e catálogo de consultas analíticas para geração de relatórios de inteligência eleitoral.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-6 pt-5 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/80 border-blue-500/80 text-blue-900 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-slate-50/60 border-slate-200/70 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
                  />
                  <span className={`text-xs font-bold ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                    {tab.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {tab.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtab Content */}
      <div className="transition-all duration-200">
        {activeSubTab === 'queries' && <AnalyticsQueries />}
        {activeSubTab === 'diagram' && <SchemaDiagram />}
        {activeSubTab === 'ddl' && <DdlViewer />}
        {activeSubTab === 'indexes' && <IndexesViewer />}
      </div>
    </div>
  );
};
