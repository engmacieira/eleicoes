import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DdlViewer } from './components/DdlViewer';
import { IndexesViewer } from './components/IndexesViewer';
import { SchemaDiagram } from './components/SchemaDiagram';
import { CloudSqlGuide } from './components/CloudSqlGuide';
import { DataSeeder } from './components/DataSeeder';
import { AnalyticsQueries } from './components/AnalyticsQueries';
import { RawElectionDataset } from './types/election';
import { FULL_DDL_SCRIPT, FULL_INDEXES_SCRIPT, ANALYTICS_VIEWS_SCRIPT, generateSeedSql } from './utils/sqlGenerator';
import { Database, CheckCircle2, FileText, Layers, ShieldCheck, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ddl');
  const [dataset, setDataset] = useState<RawElectionDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/assets/aistudio/eleicoes_braunas_ed52d128.json')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar JSON das eleições');
        return res.json();
      })
      .then((data: RawElectionDataset) => {
        setDataset(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro carregando dataset:', err);
        setLoading(false);
      });
  }, []);

  const handleDownloadAllSql = () => {
    const seed = dataset ? generateSeedSql(dataset) : '';
    const fullPackage = `/* =======================================================================
   PACOTE COMPLETO: BANCO DE DADOS ELEIÇÕES MUNICIPAIS (2000 - 2024)
   SGBD: GOOGLE CLOUD SQL (POSTGRESQL 15+)
   CONTEÚDO:
   1. SCHEMA DDL (TABELAS E CONSTRAINTS)
   2. ÍNDICES ESTRATÉGICOS
   3. VIEWS ANALÍTICAS
   4. CARGA DE DADOS HISTÓRICOS (BRAÚNAS - MG)
   ======================================================================= */

${FULL_DDL_SCRIPT}

${FULL_INDEXES_SCRIPT}

${ANALYTICS_VIEWS_SCRIPT}

${seed}
`;

    const blob = new Blob([fullPackage], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database_eleicoes_cloudsql_completo.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadAllSql={handleDownloadAllSql}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Architectural Context Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-1">
              <span className="uppercase tracking-wider">Arquitetura de Dados & DBA GCP</span>
              <span>•</span>
              <span className="text-slate-400">PostgreSQL Relational DDL Specification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Modelagem de Eleições Municipais (2000 a 2024)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Estruturação relacional completa com integridade referencial, normalização para análise de candidaturas, estatísticas de votação das urnas e catálogo partidário.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-slate-400 text-[10px]">Integridade</div>
                <div className="font-semibold text-white">Chaves & Constraints</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <Database className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-slate-400 text-[10px]">Cloud Target</div>
                <div className="font-semibold text-white">Google Cloud SQL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === 'ddl' && <DdlViewer />}
        {activeTab === 'indexes' && <IndexesViewer />}
        {activeTab === 'er_diagram' && <SchemaDiagram />}
        {activeTab === 'cloud_sql_guide' && <CloudSqlGuide />}
        {activeTab === 'data_seeder' && <DataSeeder dataset={dataset} />}
        {activeTab === 'analytics' && <AnalyticsQueries />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Google Cloud SQL (PostgreSQL Engine) • Modelagem Relacional & DBA Workbench</span>
          </div>
          <div>
            Fonte de Dados: API de Dados Abertos do TSE & DTO Municipal (2000 - 2024)
          </div>
        </div>
      </footer>
    </div>
  );
}
