import React from 'react';
import { RouterProvider, useAppRouter } from './router/RouterContext';
import { Layout } from './components/Layout';
import { PleitoPage } from './pages/PleitoPage';
import { PartidosPage } from './pages/PartidosPage';
import { DossiePage } from './pages/DossiePage';
import { CandidatoDetailPage } from './pages/CandidatoDetailPage';
import { CadastrosPage } from './pages/CadastrosPage';
import { ColigacoesPage } from './pages/ColigacoesPage';
import { QuocienteEleitoralPage } from './pages/QuocienteEleitoralPage';
import { SqlExplorerPage } from './pages/SqlExplorerPage';
import { CloudSqlConfigPage } from './pages/CloudSqlConfigPage';
import {
  FULL_DDL_SCRIPT,
  FULL_INDEXES_SCRIPT,
  ANALYTICS_VIEWS_SCRIPT,
  generateSeedSql,
} from './utils/sqlGenerator';
import { loadFallbackDataset } from './services/api';

const AppContent: React.FC = () => {
  const { currentRoute, navigate } = useAppRouter();

  const handleDownloadAllSql = async () => {
    let seed = '';
    try {
      const ds = await loadFallbackDataset();
      if (ds) {
        seed = generateSeedSql(ds);
      }
    } catch (e) {
      console.warn('Dataset não pôde ser carregado para exportação do seed:', e);
    }

    const fullPackage = `/* =======================================================================
   PACOTE COMPLETO: BANCO DE DADOS ELEIÇÕES MUNICIPAIS (2000 - 2024)
   SGBD: GOOGLE CLOUD SQL (POSTGRESQL 15+)
   HOST: 34.95.135.110 | DATABASE: eleicoes_db
   CONTEÚDO:
   1. SCHEMA DDL (TABELAS E CONSTRAINTS)
   2. ÍNDICES ESTRATÉGICOS B-TREE
   3. VIEWS ANALÍTICAS PARA BI
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

  // Map route name to tab id in layout
  const activeTabId =
    currentRoute.name === 'candidato' ? 'dossie' : currentRoute.name;

  return (
    <Layout
      activeTab={activeTabId}
      setActiveTab={(tab) => navigate(tab)}
      onDownloadAllSql={handleDownloadAllSql}
    >
      {/* Decentralized Page Routes */}
      {currentRoute.name === 'pleito' && <PleitoPage />}
      {currentRoute.name === 'partidos' && <PartidosPage />}
      {currentRoute.name === 'coligacoes' && <ColigacoesPage />}
      {currentRoute.name === 'quociente' && <QuocienteEleitoralPage />}
      {currentRoute.name === 'dossie' && <DossiePage />}
      {currentRoute.name === 'candidato' && <CandidatoDetailPage />}
      {currentRoute.name === 'cadastros' && <CadastrosPage />}
      {currentRoute.name === 'sql_explorer' && <SqlExplorerPage />}
      {currentRoute.name === 'infra_config' && <CloudSqlConfigPage />}
    </Layout>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
