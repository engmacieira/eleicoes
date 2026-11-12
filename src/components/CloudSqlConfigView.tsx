import React, { useState } from 'react';
import { CloudSqlStatus } from './CloudSqlStatus';
import { CloudSqlGuide } from './CloudSqlGuide';
import { DataSeeder } from './DataSeeder';
import { RawElectionDataset } from '../types/election';
import {
  Server,
  BookOpen,
  Database,
  Terminal,
  Activity,
  UploadCloud,
} from 'lucide-react';

interface CloudSqlConfigViewProps {
  dataset: RawElectionDataset | null;
  initialTab?: 'status' | 'guide' | 'seeder';
}

export const CloudSqlConfigView: React.FC<CloudSqlConfigViewProps> = ({
  dataset,
  initialTab = 'status',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'guide' | 'seeder'>(initialTab);

  const tabs = [
    {
      id: 'status' as const,
      label: 'Status & Backend FastAPI',
      icon: Activity,
      desc: 'Conexão com PostgreSQL 15 no GCP e código Python',
    },
    {
      id: 'guide' as const,
      label: 'Guia de Instanciação Cloud SQL',
      icon: BookOpen,
      desc: 'Passo a passo no Console GCP e automação gcloud CLI',
    },
    {
      id: 'seeder' as const,
      label: 'Carga de Dados Históricos (ETL)',
      icon: UploadCloud,
      desc: 'Conversão do DTO JSON para INSERTs relacionais',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Context Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700 mb-1">
              <span className="uppercase tracking-wider">Infraestrutura em Nuvem • Google Cloud SQL</span>
              <span>·</span>
              <span className="text-slate-500">southamerica-east1 (São Paulo)</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Server className="w-6 h-6 text-blue-600" />
              <span>Configuração & Cloud SQL</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Gerenciamento da instância gerenciada <code>eleicoes-db-instance</code> (IP 34.95.135.110), rotinas de pipeline de carga (ETL), e conexão do backend FastAPI.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-100">
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
        {activeSubTab === 'status' && <CloudSqlStatus />}
        {activeSubTab === 'guide' && <CloudSqlGuide />}
        {activeSubTab === 'seeder' && <DataSeeder dataset={dataset} />}
      </div>
    </div>
  );
};
