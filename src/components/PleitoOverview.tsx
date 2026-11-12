import React, { useState, useMemo, useEffect } from 'react';
import {
  DetalhesVotacaoDto,
  ResultadoCandidatoDto,
} from '../types/election';
import {
  Users,
  Vote,
  Percent,
  FileCheck2,
  FileX2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Award,
  Building2,
  X,
  UserCheck,
  Wrench,
  Save,
  Link2,
  AlertCircle,
  User,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  corrigirVinculoCandidatura,
  getCandidatosCadastrados,
  getAnosDisponiveis,
} from '../services/api';

interface PleitoOverviewProps {
  ano: number;
  setAno: (ano: number) => void;
  cargo: 'Prefeito' | 'Vereador';
  setCargo: (cargo: 'Prefeito' | 'Vereador') => void;
  detalhes: DetalhesVotacaoDto | null;
  resultados: ResultadoCandidatoDto[];
  loading: boolean;
  onSelectCandidato: (tituloEleitor: string) => void;
  onRefreshResultados?: () => void;
}

export const PleitoOverview: React.FC<PleitoOverviewProps> = ({
  ano,
  setAno,
  cargo,
  setCargo,
  detalhes,
  resultados,
  loading,
  onSelectCandidato,
  onRefreshResultados,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<'todos' | 'eleitos' | 'suplentes' | 'nao_eleitos'>('todos');

  // Correction Modal States
  const [corrigirModalOpen, setCorrigirModalOpen] = useState(false);
  const [candidatoCorrigindo, setCandidatoCorrigindo] = useState<ResultadoCandidatoDto | null>(null);
  const [focusSection, setFocusSection] = useState<'vice' | 'titular'>('vice');
  const [salvandoCorrecao, setSalvandoCorrecao] = useState(false);

  const [formCorrigir, setFormCorrigir] = useState({
    titularTitulo: '',
    titularNome: '',
    titularUrna: '',
    viceTitulo: '',
    viceNome: '',
    viceUrna: '',
    vicePartido: '',
  });

  // Candidate Quick Autocomplete Search
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState<Array<{ titulo_eleitor: string; nome_completo: string }>>([]);
  const [loadingQuickSearch, setLoadingQuickSearch] = useState(false);
  const [quickSearchTarget, setQuickSearchTarget] = useState<'titular' | 'vice'>('vice');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const openCorrigirModal = (cand: ResultadoCandidatoDto, focus: 'vice' | 'titular' = 'vice') => {
    setCandidatoCorrigindo(cand);
    setFocusSection(focus);
    setFormCorrigir({
      titularTitulo: cand.titulo_eleitor || '',
      titularNome: cand.nome_completo || '',
      titularUrna: cand.nome_urna || '',
      viceTitulo: cand.vice?.titulo_eleitor || '',
      viceNome: cand.vice?.nome_completo || '',
      viceUrna: cand.vice?.nome_urna || '',
      vicePartido: cand.vice?.sigla_partido || cand.sigla_partido || '',
    });
    setQuickSearchQuery('');
    setQuickSearchResults([]);
    setCorrigirModalOpen(true);
  };

  // Search candidate autocomplete
  useEffect(() => {
    if (!quickSearchQuery || quickSearchQuery.trim().length < 2) {
      setQuickSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoadingQuickSearch(true);
      getCandidatosCadastrados({ search: quickSearchQuery.trim(), limit: 8 })
        .then((res) => {
          setQuickSearchResults(res.items.map((i) => ({ titulo_eleitor: i.titulo_eleitor, nome_completo: i.nome_completo })));
          setLoadingQuickSearch(false);
        })
        .catch(() => setLoadingQuickSearch(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [quickSearchQuery]);

  const handleSelectQuickSearchCandidate = (cand: { titulo_eleitor: string; nome_completo: string }) => {
    if (quickSearchTarget === 'vice') {
      setFormCorrigir((prev) => ({
        ...prev,
        viceTitulo: cand.titulo_eleitor,
        viceNome: cand.nome_completo,
      }));
    } else {
      setFormCorrigir((prev) => ({
        ...prev,
        titularTitulo: cand.titulo_eleitor,
        titularNome: cand.nome_completo,
      }));
    }
    setQuickSearchQuery('');
    setQuickSearchResults([]);
  };

  const handleSaveCorrecao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidatoCorrigindo) return;

    setSalvandoCorrecao(true);
    try {
      await corrigirVinculoCandidatura({
        ano,
        cargo,
        numero_urna: candidatoCorrigindo.numero_urna,
        titular_novo_titulo: formCorrigir.titularTitulo.trim(),
        titular_novo_nome_completo: formCorrigir.titularNome.trim(),
        titular_novo_nome_urna: formCorrigir.titularUrna.trim(),
        vice_novo_titulo: formCorrigir.viceTitulo.trim(),
        vice_novo_nome_completo: formCorrigir.viceNome.trim(),
        vice_novo_nome_urna: formCorrigir.viceUrna.trim(),
        vice_nova_sigla: formCorrigir.vicePartido.trim(),
      });

      showToast(
        'success',
        cargo === 'Prefeito'
          ? `Vínculo da chapa nº ${candidatoCorrigindo.numero_urna} atualizado com sucesso! Novo título do vice: ${formCorrigir.viceTitulo}`
          : `Candidatura nº ${candidatoCorrigindo.numero_urna} vinculada ao título ${formCorrigir.titularTitulo} com sucesso!`
      );

      setCorrigirModalOpen(false);
      setCandidatoCorrigindo(null);
      if (onRefreshResultados) {
        onRefreshResultados();
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Falha ao salvar correção de vínculo.');
    } finally {
      setSalvandoCorrecao(false);
    }
  };

  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([2024, 2020, 2016, 2012, 2008, 2004, 2000]);

  useEffect(() => {
    getAnosDisponiveis().then((res) => {
      if (res && res.length > 0) {
        setAnosDisponiveis((prev) => {
          const set = new Set([...res, ...prev]);
          return Array.from(set).sort((a, b) => b - a);
        });
      }
    });
  }, []);

  const filteredResultados = useMemo(() => {
    return resultados.filter((c) => {
      const matchSearch =
        c.nome_urna.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sigla_partido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.numero_urna).includes(searchTerm) ||
        c.titulo_eleitor.includes(searchTerm) ||
        (c.vice && (
          c.vice.nome_urna.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.vice.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.vice.titulo_eleitor.includes(searchTerm)
        ));

      if (!matchSearch) return false;

      const sit = c.situacao.toLowerCase();
      if (situacaoFilter === 'eleitos') {
        return sit.includes('eleito') && !sit.includes('não');
      }
      if (situacaoFilter === 'suplentes') {
        return sit.includes('suplente');
      }
      if (situacaoFilter === 'nao_eleitos') {
        return sit.includes('não') || sit.includes('nao');
      }

      return true;
    });
  }, [resultados, searchTerm, situacaoFilter]);

  const totalVotosValidos = useMemo(() => {
    if (detalhes && detalhes.validos > 0) return detalhes.validos;
    return resultados.reduce((acc, c) => acc + c.votos, 0);
  }, [detalhes, resultados]);

  // Estimativa do Quociente Eleitoral (9 cadeiras legislativas em Braúnas)
  const quocienteEleitoral = useMemo(() => {
    if (cargo !== 'Vereador' || totalVotosValidos === 0) return null;
    return Math.round(totalVotosValidos / 9);
  }, [cargo, totalVotosValidos]);

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Apuração & Balanço do Pleito ({ano})
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {cargo === 'Prefeito'
            ? 'Chapas majoritárias concorrentes à Prefeitura Municipal. É possível consultar separadamente o dossiê do Prefeito e do Vice-Prefeito.'
            : 'Indicadores consolidados da urna, quociente eleitoral e classificação oficial de candidatos a Vereador em Braúnas/MG.'}
        </p>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-2xs'
              : 'bg-red-50 text-red-900 border-red-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls Bar: Ano e Cargo Selector */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Seletor de Pleito */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Ano da Eleição:
            </span>
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              {anosDisponiveis.map((a) => (
                <button
                  key={a}
                  onClick={() => setAno(a)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    ano === a
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de Cargo */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Cargo em Disputa:
            </span>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setCargo('Prefeito')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  cargo === 'Prefeito'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Prefeito & Vice</span>
              </button>
              <button
                onClick={() => setCargo('Vereador')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  cargo === 'Vereador'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Vereador</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards (4 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Eleitorado Apto */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Eleitorado Apto</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {detalhes ? detalhes.aptos.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            100% da circunscrição municipal
          </div>
        </div>

        {/* Comparecimento */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Comparecimento às Urnas</span>
            <Vote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2 tabular-nums">
            {detalhes ? detalhes.comparecimento.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            {detalhes ? `${detalhes.taxa_comparecimento_pct}% de participação` : '—'}
          </div>
        </div>

        {/* Abstenções */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Taxa de Abstenção</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2 tabular-nums">
            {detalhes ? detalhes.abstencoes.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            {detalhes ? `${detalhes.taxa_abstencao_pct}% não compareceram` : '—'}
          </div>
        </div>

        {/* Votos Válidos */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Votos Válidos</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2 tabular-nums">
            {totalVotosValidos.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {cargo === 'Vereador' ? 'Nominais e de Legenda' : 'Votos computados às chapas'}
          </div>
        </div>
      </div>

      {/* Secondary Balance Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">Votos em Branco:</span>
          <span className="font-bold text-slate-700 text-sm tabular-nums">
            {detalhes ? detalhes.brancos.toLocaleString('pt-BR') : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {detalhes && detalhes.comparecimento > 0
              ? `${((detalhes.brancos / detalhes.comparecimento) * 100).toFixed(1)}% do comparecimento`
              : ''}
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">Votos Nulos:</span>
          <span className="font-bold text-rose-700 text-sm tabular-nums">
            {detalhes ? detalhes.nulos.toLocaleString('pt-BR') : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {detalhes && detalhes.comparecimento > 0
              ? `${((detalhes.nulos / detalhes.comparecimento) * 100).toFixed(1)}% do comparecimento`
              : ''}
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">
            {cargo === 'Vereador' ? 'Quociente Eleitoral (Estimado):' : 'Margem de Vitória:'}
          </span>
          <span className="font-bold text-blue-700 text-sm tabular-nums flex items-center gap-1">
            {cargo === 'Vereador' ? (
              quocienteEleitoral ? `~${quocienteEleitoral} votos / cadeira` : '—'
            ) : (
              resultados.length >= 2
                ? `${(resultados[0].votos - resultados[1].votos).toLocaleString('pt-BR')} votos`
                : '—'
            )}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {cargo === 'Vereador' ? 'Câmara Municipal (9 vagas)' : 'Diferença 1º x 2º colocado'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">
            {cargo === 'Prefeito' ? 'Chapas Registradas:' : 'Candidaturas Registradas:'}
          </span>
          <span className="font-bold text-slate-900 text-sm tabular-nums">
            {resultados.length} {cargo === 'Prefeito' ? 'chapas majoritárias' : 'postulantes'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            com apuração pelo TSE
          </span>
        </div>
      </div>

      {/* Resultados Oficiais Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {/* Table Controls & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>
                {cargo === 'Prefeito' ? `Eleição Majoritária — Chapas a Prefeito em ${ano}` : `Classificação Oficial — Vereador em ${ano}`}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 ml-1">
                {filteredResultados.length} {filteredResultados.length === 1 ? 'chapa' : 'chapas'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {cargo === 'Prefeito'
                ? 'Clique no botão correspondente para abrir o dossiê do Prefeito ou do Vice-Prefeito.'
                : 'Clique em qualquer linha ou no botão para abrir o Dossiê Histórico Completo do candidato.'}
            </p>
          </div>

          {/* Search Input & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={cargo === 'Prefeito' ? 'Buscar prefeito, vice, título...' : 'Buscar candidato, partido, nº...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 w-64 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSituacaoFilter('todos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  situacaoFilter === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSituacaoFilter('eleitos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  situacaoFilter === 'eleitos' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Eleitos
              </button>
              {cargo === 'Vereador' && (
                <button
                  onClick={() => setSituacaoFilter('suplentes')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                    situacaoFilter === 'suplentes' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Suplentes
                </button>
              )}
              <button
                onClick={() => setSituacaoFilter('nao_eleitos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  situacaoFilter === 'nao_eleitos' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Não Eleitos
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            /* Skeleton Loading State */
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3 px-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3 w-1/3">
                    <div className="w-6 h-6 bg-slate-200 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-16" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                  <div className="h-4 bg-slate-200 rounded w-20" />
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
              ))}
            </div>
          ) : filteredResultados.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center text-slate-500">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">Nenhum registro localizado</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Não encontramos candidaturas correspondentes ao termo "{searchTerm}" ou ao filtro selecionado.
              </p>
              {(searchTerm || situacaoFilter !== 'todos') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSituacaoFilter('todos');
                  }}
                  className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Pos</th>
                  <th className="py-3 px-4">
                    {cargo === 'Prefeito' ? 'Chapa Majoritária (Prefeito & Vice)' : 'Candidato'}
                  </th>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Partido</th>
                  <th className="py-3 px-4 text-right">Votos Válidos</th>
                  <th className="py-3 px-4 text-right">% Válidos</th>
                  <th className="py-3 px-4 text-center">Situação TSE</th>
                  <th className="py-3 px-4 text-center">
                    {cargo === 'Prefeito' ? 'Consultar Dossiês' : 'Ação'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResultados.map((c, index) => {
                  const isEleito =
                    c.situacao.toLowerCase().includes('eleito') &&
                    !c.situacao.toLowerCase().includes('não');
                  const isSuplente = c.situacao.toLowerCase().includes('suplente');

                  return (
                    <tr
                      key={`${c.titulo_eleitor}-${c.posicao ?? 'na'}-${index}`}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Posição */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {c.posicao ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              c.posicao === 1 && isEleito
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.posicao}º
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Nome Urna / Chapa Majoritária */}
                      <td className="py-3 px-4">
                        {/* Prefeito */}
                        <div
                          onClick={() => onSelectCandidato(c.titulo_eleitor)}
                          className="cursor-pointer group/cand"
                        >
                          <div className="font-bold text-slate-900 group-hover/cand:text-blue-700 text-sm flex items-center gap-1.5 transition">
                            <span>{c.nome_urna}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              Prefeito
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/cand:opacity-100 text-blue-600 transition" />
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-xs" title={c.nome_completo}>
                            {c.nome_completo}
                          </div>
                          <div className="text-slate-400 font-mono text-[10px]">
                            TÍTULO: {c.titulo_eleitor}
                          </div>
                        </div>

                        {/* Vice-Prefeito (quando cargo for Prefeito) */}
                        {cargo === 'Prefeito' && c.vice && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCandidato(c.vice!.titulo_eleitor);
                            }}
                            className="mt-2 pt-2 border-t border-slate-100 pl-2.5 border-l-2 border-l-purple-500 cursor-pointer group/vice hover:bg-purple-50/60 p-1.5 rounded-r transition"
                          >
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span className="font-bold text-slate-800 text-xs group-hover/vice:text-purple-700 transition">
                                Vice: {c.vice.nome_urna}
                              </span>
                              {c.vice.sigla_partido && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {c.vice.sigla_partido}
                                </span>
                              )}
                              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/vice:opacity-100 text-purple-600 transition" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCorrigirModal(c, 'vice');
                                }}
                                className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-1.5 py-0.5 rounded transition cursor-pointer"
                                title="Corrigir vínculo ou título eleitoral deste Vice"
                              >
                                <Wrench className="w-2.5 h-2.5" />
                                <span>Corrigir Vice</span>
                              </button>
                            </div>
                            <div className="text-slate-500 text-[10px] truncate max-w-xs" title={c.vice.nome_completo}>
                              {c.vice.nome_completo}
                            </div>
                            <div className="text-slate-400 font-mono text-[9px]">
                              TÍTULO: {c.vice.titulo_eleitor}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Número da Urna */}
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                        {c.numero_urna}
                      </td>

                      {/* Partido */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {c.sigla_partido}
                        </span>
                      </td>

                      {/* Votos */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {c.votos.toLocaleString('pt-BR')}
                      </td>

                      {/* Percentual */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">{c.percentual_validos}%</span>
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 hidden sm:block overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(c.percentual_validos || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isEleito
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isSuplente
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isEleito ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : isSuplente ? (
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <span>{c.situacao}</span>
                        </span>
                      </td>

                      {/* Ação (Dossiê Prefeito, Dossiê Vice e Botão de Corrigir) */}
                      <td className="py-3 px-4 text-center">
                        {cargo === 'Prefeito' ? (
                          <div className="flex flex-col gap-1.5 items-stretch min-w-[125px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCandidato(c.titulo_eleitor);
                              }}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-semibold transition cursor-pointer text-center"
                              title={`Abrir Dossiê de ${c.nome_urna} (Prefeito)`}
                            >
                              Dossiê Prefeito
                            </button>
                            {c.vice && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectCandidato(c.vice!.titulo_eleitor);
                                }}
                                className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 text-[11px] font-semibold transition cursor-pointer text-center"
                                title={`Abrir Dossiê de ${c.vice.nome_urna} (Vice-Prefeito)`}
                              >
                                Dossiê Vice
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCorrigirModal(c, 'vice');
                              }}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white border border-amber-300 text-[11px] font-semibold transition cursor-pointer"
                              title="Corrigir vínculo de candidatos, título do vice ou titular"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Corrigir Chapa</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 items-stretch min-w-[110px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCandidato(c.titulo_eleitor);
                              }}
                              className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-semibold transition cursor-pointer text-center"
                            >
                              Dossiê
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCorrigirModal(c, 'titular');
                              }}
                              className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-[10px] font-semibold transition cursor-pointer"
                              title="Corrigir vínculo ou título eleitoral desta candidatura"
                            >
                              <Wrench className="w-2.5 h-2.5" />
                              <span>Corrigir</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Correção de Vínculo de Candidatura */}
      {corrigirModalOpen && candidatoCorrigindo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Corrigir Vínculo de Candidatura
                  </h3>
                  <p className="text-xs text-slate-300">
                    Eleição {ano} • {cargo} • Urna nº {candidatoCorrigindo.numero_urna} ({candidatoCorrigindo.sigla_partido})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCorrigirModalOpen(false);
                  setCandidatoCorrigindo(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCorrecao} className="p-6 space-y-5">
              {/* Context Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ajuste manual de integridade cadastral: </span>
                  Utilize este formulário para retificar títulos eleitorais vinculados incorretamente ou com nomes divergentes originários da extração inicial do TSE. As alterações persistem localmente e propagam-se para o dossiê político e relatórios.
                </div>
              </div>

              {/* Preenchimento Rápido / Busca na Base de Candidatos Cadastrados */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Buscar Pessoa na Base Cadastrada (Preenchimento Rápido)
                  </span>
                  {cargo === 'Prefeito' && (
                    <div className="flex items-center space-x-1 bg-white border border-slate-200 p-0.5 rounded-md text-[11px]">
                      <button
                        type="button"
                        onClick={() => setQuickSearchTarget('vice')}
                        className={`px-2 py-0.5 rounded transition ${
                          quickSearchTarget === 'vice'
                            ? 'bg-purple-100 text-purple-800 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Aplicar ao Vice
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickSearchTarget('titular')}
                        className={`px-2 py-0.5 rounded transition ${
                          quickSearchTarget === 'titular'
                            ? 'bg-blue-100 text-blue-800 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Aplicar ao Titular
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={quickSearchQuery}
                    onChange={(e) => setQuickSearchQuery(e.target.value)}
                    placeholder="Digite o nome ou título para localizar na base..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {loadingQuickSearch && (
                    <div className="absolute right-3 top-2 text-[10px] text-slate-400">
                      Buscando...
                    </div>
                  )}

                  {quickSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {quickSearchResults.map((cand) => (
                        <div
                          key={cand.titulo_eleitor}
                          onClick={() => handleSelectQuickSearchCandidate(cand)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{cand.nome_completo}</div>
                            <div className="text-[10px] font-mono text-slate-500">TÍTULO: {cand.titulo_eleitor}</div>
                          </div>
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Selecionar
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 1: Titular (Prefeito ou Vereador) */}
              <div className="space-y-3 p-3.5 border border-slate-200 rounded-xl bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    {cargo === 'Prefeito' ? 'Candidato a Prefeito (Titular)' : 'Candidato a Vereador'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Urna: {candidatoCorrigindo.numero_urna}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Título de Eleitor *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCorrigir.titularTitulo}
                      onChange={(e) => setFormCorrigir({ ...formCorrigir, titularTitulo: e.target.value })}
                      className="w-full text-xs font-mono px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="000000000000"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nome Civil Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCorrigir.titularNome}
                      onChange={(e) => setFormCorrigir({ ...formCorrigir, titularNome: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nome na Urna *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCorrigir.titularUrna}
                      onChange={(e) => setFormCorrigir({ ...formCorrigir, titularUrna: e.target.value })}
                      className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Vice-Prefeito (quando cargo for Prefeito) */}
              {cargo === 'Prefeito' && (
                <div className="space-y-3 p-3.5 border-2 border-purple-200 bg-purple-50/40 rounded-xl">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      Candidato a Vice-Prefeito (Composição da Chapa)
                    </span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                      Chapa Majoritária
                    </span>
                  </div>

                  <p className="text-[11px] text-purple-950">
                    Para corrigir casos em que a extração associou o título de outro cidadão ao vice, informe o <strong>Título de Eleitor real</strong> e o <strong>Nome Civil correto</strong> do Vice-Prefeito.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                        Título de Eleitor do Vice *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCorrigir.viceTitulo}
                        onChange={(e) => setFormCorrigir({ ...formCorrigir, viceTitulo: e.target.value })}
                        className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-purple-900"
                        placeholder="Ex: 000000000000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                        Nome Civil do Vice *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCorrigir.viceNome}
                        onChange={(e) => setFormCorrigir({ ...formCorrigir, viceNome: e.target.value })}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                        placeholder="Nome civil do vice"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                        Nome na Urna do Vice
                      </label>
                      <input
                        type="text"
                        value={formCorrigir.viceUrna}
                        onChange={(e) => setFormCorrigir({ ...formCorrigir, viceUrna: e.target.value })}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                        placeholder="Ex: NOQUINHA"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                        Sigla do Partido do Vice
                      </label>
                      <input
                        type="text"
                        value={formCorrigir.vicePartido}
                        onChange={(e) => setFormCorrigir({ ...formCorrigir, vicePartido: e.target.value })}
                        className="w-full text-xs font-mono uppercase px-3 py-1.5 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                        placeholder="Ex: PSDB"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCorrigirModalOpen(false);
                    setCandidatoCorrigindo(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoCorrecao}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{salvandoCorrecao ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

