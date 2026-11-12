import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PleitoOverview } from './components/PleitoOverview';
import { RaioXPartidario } from './components/RaioXPartidario';
import { DossiePoliticoView } from './components/DossiePoliticoView';
import { CandidatoDossierModal } from './components/CandidatoDossierModal';
import { SqlExplorerView } from './components/SqlExplorerView';
import { CloudSqlConfigView } from './components/CloudSqlConfigView';
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

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onDownloadAllSql={handleDownloadAllSql}
    >
      {/* Context 1: Inteligência Eleitoral */}
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

      {activeTab === 'partidos' && (
        <RaioXPartidario ano={ano} setAno={setAno} />
      )}

      {activeTab === 'dossie' && (
        <DossiePoliticoView
          dataset={dataset}
          onSelectCandidato={(titulo) => setSelectedCandidato(titulo)}
        />
      )}

      {/* Context 2: Engenharia & Banco de Dados */}
      {activeTab === 'sql_explorer' && (
        <SqlExplorerView />
      )}

      {activeTab === 'infra_config' && (
        <CloudSqlConfigView dataset={dataset} />
      )}

      {/* Candidato Dossier Slide-Over Drawer */}
      <CandidatoDossierModal
        tituloEleitor={selectedCandidato}
        onClose={() => setSelectedCandidato(null)}
        onSelectAnother={(titulo) => setSelectedCandidato(titulo)}
      />
    </Layout>
  );
}
