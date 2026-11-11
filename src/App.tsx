import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PleitoOverview } from './components/PleitoOverview';
import { CandidatoDossierModal } from './components/CandidatoDossierModal';
import { RaioXPartidario } from './components/RaioXPartidario';
import { DossiePoliticoView } from './components/DossiePoliticoView';
import { CloudSqlStatus } from './components/CloudSqlStatus';
import { SchemaDiagram } from './components/SchemaDiagram';
import { DdlViewer } from './components/DdlViewer';
import {
  RawElectionDataset,
  DetalhesVotacaoDto,
  ResultadoCandidatoDto,
  EleicaoResumoDto,
} from './types/election';
import {
  getEleicoes,
  getResultados,
  loadFallbackDataset,
} from './services/api';
import {
  FULL_DDL_SCRIPT,
  FULL_INDEXES_SCRIPT,
  ANALYTICS_VIEWS_SCRIPT,
  generateSeedSql,
} from './utils/sqlGenerator';
import { Database, CheckCircle2, Server, ShieldCheck, Download, Code, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('pleito');
  const [ano, setAno] = useState<number>(2024);
  const [cargo, setCargo] = useState<'Prefeito' | 'Vereador'>('Vereador');
  const [selectedCandidato, setSelectedCandidato] = useState<string | null>(null);

  const [eleicoes, setEleicoes] = useState<EleicaoResumoDto[]>([]);
  const [detalhes, setDetalhes] = useState<DetalhesVotacaoDto | null>(null);
  const [resultados, setResultados] = useState<ResultadoCandidatoDto[]>([]);
  const [dataset, setDataset] = useState<RawElectionDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial load of elections list and raw dataset
  useEffect(() => {
    loadFallbackDataset()
      .then((ds) => setDataset(ds))
      .catch((err) => console.error('Erro carregando dataset:', err));

    getEleicoes()
      .then((data) => {
        setEleicoes(data);
      })
      .catch((err) => console.error('Erro buscando eleições:', err));
  }, []);

  // Fetch results and details whenever ano or cargo changes
  useEffect(() => {
    setLoading(true);

    Promise.all([
      getEleicoes(ano, cargo),
      getResultados(ano, cargo),
    ])
      .then(([eleicaoList, resList]) => {
        if (eleicaoList.length > 0 && eleicaoList[0].detalhes.length > 0) {
          const matched = eleicaoList[0].detalhes.find(
            (d) => d.cargo.toLowerCase() === cargo.toLowerCase()
          ) || eleicaoList[0].detalhes[0];
          setDetalhes(matched);
        } else {
          setDetalhes(null);
        }

        setResultados(resList);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro na consulta de resultados:', err);
        setLoading(false);
      });
  }, [ano, cargo]);

  const handleDownloadAllSql = () => {
    const seed = dataset ? generateSeedSql(dataset) : '';
    const fullPackage = `/* =======================================================================
   PACOTE COMPLETO: BANCO DE DADOS ELEIÇÕES MUNICIPAIS (2000 - 2024)
   SGBD: GOOGLE CLOUD SQL (POSTGRESQL 15+)
   HOST: 34.95.135.110 | DATABASE: eleicoes_db
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
        {/* Global Architectural Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-1">
              <span className="uppercase tracking-wider">FastAPI + React • Full Stack Architecture</span>
              <span>•</span>
              <span className="text-slate-400">Google Cloud SQL (34.95.135.110)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Série Histórica das Eleições Municipais (2000 a 2024)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Plataforma analítica conectada ao banco de dados relacional PostgreSQL no Cloud SQL (Braúnas/MG). Consulta em tempo real de apuração, trajetórias de candidatos e desempenho partidário.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <Server className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-slate-400 text-[10px]">Cloud SQL Instance</div>
                <div className="font-semibold text-white">34.95.135.110:5432</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <Code className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-slate-400 text-[10px]">Backend Engine</div>
                <div className="font-semibold text-white">FastAPI (Python)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Visão Geral do Pleito */}
        {activeTab === 'pleito' && (
          <PleitoOverview
            ano={ano}
            setAno={setAno}
            cargo={cargo}
            setCargo={setCargo}
            detalhes={detalhes}
            resultados={resultados}
            loading={loading}
            onSelectCandidato={(titulo) => setSelectedCandidato(titulo)}
          />
        )}

        {/* Tab 2: Dossiê do Político */}
        {activeTab === 'dossie' && (
          <DossiePoliticoView
            dataset={dataset}
            onSelectCandidato={(titulo) => setSelectedCandidato(titulo)}
          />
        )}

        {/* Tab 3: Raio-X Partidário */}
        {activeTab === 'partidos' && (
          <RaioXPartidario ano={ano} setAno={setAno} />
        )}

        {/* Tab 4: Backend FastAPI & Cloud SQL Infrastructure */}
        {activeTab === 'backend' && <CloudSqlStatus />}

        {/* Tab 5: Schema DDL & Diagrama ER */}
        {activeTab === 'schema' && (
          <div className="space-y-8">
            <SchemaDiagram />
            <DdlViewer />
          </div>
        )}
      </main>

      {/* Candidato Dossier Modal (Accessible from anywhere) */}
      <CandidatoDossierModal
        tituloEleitor={selectedCandidato}
        onClose={() => setSelectedCandidato(null)}
        onSelectAnother={(titulo) => setSelectedCandidato(titulo)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Google Cloud SQL (PostgreSQL 15) • FastAPI & React 19 • Braúnas / MG</span>
          </div>
          <div className="font-mono text-slate-400">
            Instância: 34.95.135.110 • Database: eleicoes_db
          </div>
        </div>
      </footer>
    </div>
  );
}
