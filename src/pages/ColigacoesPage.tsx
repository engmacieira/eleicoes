import React, { useState, useEffect, useMemo } from 'react';
import {
  Network,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Vote,
  Flag,
  Shield,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowRight,
  Building2,
  Award,
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  BarChart2,
  PieChart,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  getEleicoes,
  getColigacoes,
  createColigacao,
  updateColigacao,
  deleteColigacao,
  getPartidosCadastrados,
  getResultados,
  getPartidosAno,
} from '../services/api';
import {
  ColigacaoDto,
  ColigacaoMembroDto,
  CreateColigacaoPayload,
  UpdateColigacaoPayload,
  PartidoCadastroDto,
  ResultadoCandidatoDto,
  DesempenhoPartidoDto,
} from '../types/election';

export const ColigacoesPage: React.FC = () => {
  const [eleicoes, setEleicoes] = useState<number[]>([2024, 2020, 2016, 2012, 2008, 2004, 2000]);
  const [selectedAno, setSelectedAno] = useState<number>(2024);
  const [coligacoes, setColigacoes] = useState<ColigacaoDto[]>([]);
  const [partidosCadastrados, setPartidosCadastrados] = useState<PartidoCadastroDto[]>([]);
  const [prefeitosDoAno, setPrefeitosDoAno] = useState<ResultadoCandidatoDto[]>([]);
  const [partidosDesempenho, setPartidosDesempenho] = useState<DesempenhoPartidoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'paralelo' | 'matrix'>('cards');
  const [expandedCardBreakdown, setExpandedCardBreakdown] = useState<Record<number, boolean>>({});

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingColigacao, setEditingColigacao] = useState<ColigacaoDto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form State
  const [formAno, setFormAno] = useState<number>(2024);
  const [formCargo, setFormCargo] = useState<string>('Prefeito');
  const [formNumeroUrna, setFormNumeroUrna] = useState<number>(55);
  const [formNomeColigacao, setFormNomeColigacao] = useState<string>('');
  const [formSiglaTitular, setFormSiglaTitular] = useState<string>('');
  const [formPartidos, setFormPartidos] = useState<
    Array<{ id_partido: number; sigla_partido: string; papel: string }>
  >([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load registered elections
  useEffect(() => {
    const fetchEleicoes = async () => {
      try {
        const data = await getEleicoes();
        const anos = data.map((e) => e.ano).sort((a, b) => b - a);
        if (anos.length > 0) {
          setEleicoes(anos);
          if (!anos.includes(selectedAno)) {
            setSelectedAno(anos[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar pleitos:', err);
      }
    };
    fetchEleicoes();
  }, []);

  // Load parties for dropdown selection
  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const list = await getPartidosCadastrados();
        setPartidosCadastrados(list.filter((p) => !p.is_deleted));
      } catch (err) {
        console.error('Erro ao carregar partidos cadastrados:', err);
      }
    };
    fetchPartidos();
  }, []);

  // Load coalitions, mayor results and councilor performance for the selected year
  const loadData = async (ano: number) => {
    setLoading(true);
    try {
      const [coligList, prefeitosList, partidosAnoData] = await Promise.all([
        getColigacoes(ano),
        getResultados(ano, 'Prefeito').catch(() => []),
        getPartidosAno(ano).catch(() => ({ ano, partidos: [], total_geral_votos: 0 })),
      ]);
      setColigacoes(coligList);
      setPrefeitosDoAno(prefeitosList);
      setPartidosDesempenho(partidosAnoData.partidos);
    } catch (err) {
      console.error('Erro ao carregar dados de coligações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedAno);
  }, [selectedAno]);

  // Normalization helper for party acronyms (e.g. MDB <-> PMDB, PFL <-> DEM, PPB <-> PP)
  const matchPartidos = (siglaA: string, siglaB: string) => {
    const sA = siglaA.trim().toUpperCase();
    const sB = siglaB.trim().toUpperCase();
    if (sA === sB) return true;
    if ((sA === 'MDB' && sB === 'PMDB') || (sA === 'PMDB' && sB === 'MDB')) return true;
    if ((sA === 'PFL' && sB === 'DEM') || (sA === 'DEM' && sB === 'PFL')) return true;
    if ((sA === 'PPB' && sB === 'PP') || (sA === 'PP' && sB === 'PPB')) return true;
    if ((sA === 'PTB' && sB === 'PRD') || (sA === 'PRD' && sB === 'PTB')) return true;
    if ((sA === 'PR' && sB === 'PL') || (sA === 'PL' && sB === 'PR')) return true;
    return false;
  };

  // Helper to compute councilor votes (nominal + legenda) for a given coalition
  const getCoalitionCouncilStats = (c: ColigacaoDto) => {
    const partyStats = c.partidos.map((membro) => {
      const found = partidosDesempenho.find((p) => matchPartidos(p.sigla, membro.sigla_partido));
      return {
        sigla: membro.sigla_partido,
        papel: membro.papel,
        votos_nominais: found ? found.votos_nominais : 0,
        votos_legenda: found ? found.votos_legenda : 0,
        total_votos: found ? found.total_votos : 0,
      };
    });

    const totalNominais = partyStats.reduce((acc, p) => acc + p.votos_nominais, 0);
    const totalLegenda = partyStats.reduce((acc, p) => acc + p.votos_legenda, 0);
    const totalVereadores = totalNominais + totalLegenda;
    const votosPrefeito = c.votos || 0;
    const saldo = votosPrefeito - totalVereadores;
    const razao = totalVereadores > 0 ? (votosPrefeito / totalVereadores) * 100 : 0;

    return {
      partyStats,
      totalNominais,
      totalLegenda,
      totalVereadores,
      votosPrefeito,
      saldo,
      razao,
    };
  };

  // Prepare chart data for the Parallel Analytical view
  const chartData = useMemo(() => {
    return coligacoes.map((c) => {
      const stats = getCoalitionCouncilStats(c);
      const label = c.candidato_nome || `Chapa ${c.numero_urna}`;
      return {
        id: c.id,
        nome: label,
        sigla: c.sigla_partido_titular,
        coligacao: c.nome_coligacao,
        rotulo: `${label} (${c.sigla_partido_titular})`,
        votosPrefeito: stats.votosPrefeito,
        votosNominais: stats.totalNominais,
        votosLegenda: stats.totalLegenda,
        totalVereadores: stats.totalVereadores,
        saldo: stats.saldo,
        razao: stats.razao,
      };
    });
  }, [coligacoes, partidosDesempenho]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingColigacao(null);
    setFormAno(selectedAno);
    setFormCargo('Prefeito');

    // Default to first mayor candidate if available
    const firstPref = prefeitosDoAno[0];
    if (firstPref) {
      setFormNumeroUrna(firstPref.numero_urna);
      setFormSiglaTitular(firstPref.sigla_partido);
      setFormNomeColigacao(`Coligação ${firstPref.sigla_partido}`);
      const initialMembers = [
        {
          id_partido: firstPref.numero_urna,
          sigla_partido: firstPref.sigla_partido,
          papel: 'Cabeça de Chapa',
        },
      ];
      if (firstPref.vice && firstPref.vice.sigla_partido && firstPref.vice.sigla_partido !== firstPref.sigla_partido) {
        initialMembers.push({
          id_partido: 0,
          sigla_partido: firstPref.vice.sigla_partido,
          papel: 'Vice-Prefeito',
        });
      }
      setFormPartidos(initialMembers);
    } else {
      setFormNumeroUrna(55);
      setFormSiglaTitular('PSD');
      setFormNomeColigacao('');
      setFormPartidos([
        { id_partido: 55, sigla_partido: 'PSD', papel: 'Cabeça de Chapa' },
      ]);
    }

    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (col: ColigacaoDto) => {
    setEditingColigacao(col);
    setFormAno(col.ano_eleicao);
    setFormCargo(col.cargo || 'Prefeito');
    setFormNumeroUrna(col.numero_urna);
    setFormNomeColigacao(col.nome_coligacao);
    setFormSiglaTitular(col.sigla_partido_titular);
    setFormPartidos(
      col.partidos.map((p) => ({
        id_partido: p.id_partido,
        sigla_partido: p.sigla_partido,
        papel: p.papel,
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  // Add party to coalition form
  const handleAddPartidoToForm = (sigla: string) => {
    if (!sigla) return;
    if (formPartidos.some((p) => p.sigla_partido === sigla)) {
      return;
    }
    const partidoObj = partidosCadastrados.find((p) => p.sigla === sigla);
    setFormPartidos((prev) => [
      ...prev,
      {
        id_partido: partidoObj ? partidoObj.id : 0,
        sigla_partido: sigla,
        papel: prev.length === 0 ? 'Cabeça de Chapa' : prev.length === 1 ? 'Vice-Prefeito' : 'Partido Apoiador',
      },
    ]);
  };

  // Remove party from form
  const handleRemovePartidoFromForm = (sigla: string) => {
    setFormPartidos((prev) => prev.filter((p) => p.sigla_partido !== sigla));
  };

  // Change party role
  const handleChangePapel = (sigla: string, newPapel: string) => {
    setFormPartidos((prev) =>
      prev.map((p) => (p.sigla_partido === sigla ? { ...p, papel: newPapel } : p))
    );
  };

  // Submit modal form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomeColigacao.trim()) {
      setFormError('Informe o nome da coligação partidária.');
      return;
    }
    if (!formSiglaTitular.trim()) {
      setFormError('Informe a sigla do partido titular (cabeça de chapa).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const composicao = formPartidos.map((p) => p.sigla_partido).join(' / ') || formSiglaTitular;

      if (editingColigacao) {
        const payload: UpdateColigacaoPayload = {
          cargo: formCargo,
          numero_urna: formNumeroUrna,
          nome_coligacao: formNomeColigacao.trim(),
          sigla_partido_titular: formSiglaTitular.toUpperCase().trim(),
          composicao_siglas: composicao,
          partidos: formPartidos,
        };
        await updateColigacao(editingColigacao.id, payload);
      } else {
        const payload: CreateColigacaoPayload = {
          ano_eleicao: formAno,
          cargo: formCargo,
          numero_urna: formNumeroUrna,
          nome_coligacao: formNomeColigacao.trim(),
          sigla_partido_titular: formSiglaTitular.toUpperCase().trim(),
          composicao_siglas: composicao,
          partidos: formPartidos,
        };
        await createColigacao(payload);
      }

      await loadData(selectedAno);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Falha ao salvar coligação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete coalition
  const handleDeleteColigacao = async (id: number) => {
    try {
      await deleteColigacao(id);
      setDeleteConfirmId(null);
      await loadData(selectedAno);
    } catch (err) {
      console.error('Erro ao excluir coligação:', err);
    }
  };

  // Toggle card breakdown table
  const toggleCardBreakdown = (id: number) => {
    setExpandedCardBreakdown((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered coalitions based on search query
  const filteredColigacoes = useMemo(() => {
    if (!searchTerm.trim()) return coligacoes;
    const q = searchTerm.toLowerCase();
    return coligacoes.filter(
      (c) =>
        c.nome_coligacao.toLowerCase().includes(q) ||
        c.sigla_partido_titular.toLowerCase().includes(q) ||
        c.composicao_siglas.toLowerCase().includes(q) ||
        String(c.numero_urna).includes(q) ||
        (c.candidato_nome && c.candidato_nome.toLowerCase().includes(q)) ||
        (c.vice_nome && c.vice_nome.toLowerCase().includes(q))
    );
  }, [coligacoes, searchTerm]);

  // KPIs
  const totalChapas = coligacoes.length;
  const todasSiglas = useMemo(() => {
    const setSiglas = new Set<string>();
    coligacoes.forEach((c) => {
      c.partidos.forEach((p) => setSiglas.add(p.sigla_partido));
    });
    return Array.from(setSiglas);
  }, [coligacoes]);

  const chapaVencedora = useMemo(() => {
    return coligacoes.find(
      (c) => c.situacao?.toUpperCase().includes('ELEITO') && !c.situacao?.toUpperCase().includes('NÃO')
    );
  }, [coligacoes]);

  const maiorAlianca = useMemo(() => {
    if (coligacoes.length === 0) return null;
    return [...coligacoes].sort((a, b) => b.partidos.length - a.partidos.length)[0];
  }, [coligacoes]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Coligações Partidárias
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mapeamento de arcos de alianças, chapas majoritárias e o paralelo direto entre a votação do Prefeito e os votos totais de Vereadores (nominais e de legenda).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle with Paralelo option */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cards de Chapas
            </button>
            <button
              onClick={() => setViewMode('paralelo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'paralelo'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Paralelo Prefeito x Vereadores</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriz de Apoios
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Coligação</span>
          </button>
        </div>
      </div>

      {/* Year Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {eleicoes.map((ano) => (
          <button
            key={ano}
            onClick={() => setSelectedAno(ano)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedAno === ano
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Eleição {ano}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Chapas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total de Chapas
            </span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Vote className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? '...' : totalChapas}
            </span>
            <span className="text-xs text-slate-500">candidaturas a Prefeito</span>
          </div>
        </div>

        {/* Legendas Envolvidas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Partidos em Coligações
            </span>
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Flag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? '...' : todasSiglas.length}
            </span>
            <span className="text-xs text-slate-500">siglas ativas no pleito</span>
          </div>
        </div>

        {/* Chapa Vencedora */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Chapa Vencedora ({selectedAno})
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            {chapaVencedora ? (
              <>
                <div className="font-bold text-slate-900 truncate">
                  {chapaVencedora.candidato_nome || `Chapa ${chapaVencedora.numero_urna}`}
                </div>
                <div className="text-xs text-emerald-700 font-medium truncate mt-0.5">
                  {chapaVencedora.nome_coligacao} ({chapaVencedora.sigla_partido_titular})
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">Resultado em aberto / Histórico</span>
            )}
          </div>
        </div>

        {/* Maior Aliança */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Maior Aliança
            </span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            {maiorAlianca ? (
              <>
                <div className="font-bold text-slate-900 truncate">
                  {maiorAlianca.nome_coligacao}
                </div>
                <div className="text-xs text-purple-700 font-medium truncate mt-0.5">
                  {maiorAlianca.partidos.length} partido(s): {maiorAlianca.composicao_siglas}
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">Sem registros</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por coligação, prefeito, vice, partido ou número de urna..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 whitespace-nowrap">
          Exibindo <span className="font-semibold text-slate-800">{filteredColigacoes.length}</span> coligação(ões) em <span className="font-semibold text-slate-800">{selectedAno}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm text-slate-500">Carregando dados das coligações partidárias...</p>
        </div>
      ) : filteredColigacoes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
          <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhuma coligação encontrada</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {searchTerm
              ? 'Nenhum resultado corresponde à sua busca neste pleito.'
              : `Ainda não há coligações cadastradas para as eleições de ${selectedAno}.`}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Coligação</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW WITH EMBEDDED PARALLEL SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredColigacoes.map((col) => {
            const isEleito = col.situacao?.toUpperCase().includes('ELEITO') && !col.situacao?.toUpperCase().includes('NÃO');
            const stats = getCoalitionCouncilStats(col);
            const isExpanded = !!expandedCardBreakdown[col.id];

            return (
              <div
                key={col.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                {/* Header of Card */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-sm shadow-indigo-200">
                        {col.numero_urna}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {col.nome_coligacao}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Partido Titular: {col.sigla_partido_titular}
                          </span>
                          {isEleito && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Eleito
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(col)}
                        title="Editar Coligação"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(col.id)}
                        title="Excluir Coligação"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Candidate & Vice Section */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Candidato a Prefeito
                      </span>
                      <div className="font-semibold text-sm text-slate-900 truncate mt-0.5">
                        {col.candidato_nome || `Candidato Chapa ${col.numero_urna}`}
                      </div>
                      <span className="text-xs text-indigo-700 font-medium">
                        {col.sigla_partido_titular}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Candidato a Vice-Prefeito
                      </span>
                      <div className="font-semibold text-sm text-slate-900 truncate mt-0.5">
                        {col.vice_nome || 'Não informado'}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {col.partidos.find((p) => p.papel === 'Vice-Prefeito')?.sigla_partido || 'Mesma legenda'}
                      </span>
                    </div>
                  </div>

                  {/* PARALELO ELEITORAL: PREFEITO VS VEREADORES DA COLIGAÇÃO */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Scale className="w-4 h-4 text-indigo-600" />
                        <span>Paralelo: Prefeito vs. Vereadores da Aliança</span>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        stats.saldo > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : stats.saldo < 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {stats.saldo > 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            Prefeito +{stats.saldo.toLocaleString('pt-BR')}
                          </>
                        ) : stats.saldo < 0 ? (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            Bancada +{Math.abs(stats.saldo).toLocaleString('pt-BR')}
                          </>
                        ) : (
                          'Equilíbrio Exato'
                        )}
                      </span>
                    </div>

                    {/* Votos Prefeito vs Vereadores Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                          <span>Votos do Prefeito</span>
                          <span className="text-[10px] text-indigo-600 font-bold">Majoritário</span>
                        </div>
                        <div className="text-xl font-black text-indigo-700 tabular-nums mt-0.5">
                          {stats.votosPrefeito.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {col.percentual_validos?.toFixed(2)}% dos válidos
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                          <span>Vereadores (Aliança)</span>
                          <span className="text-[10px] text-blue-600 font-bold">Proporcional</span>
                        </div>
                        <div className="text-xl font-black text-slate-900 tabular-nums mt-0.5">
                          {stats.totalVereadores.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex gap-1.5 font-mono text-[10px]">
                          <span>Nom: {stats.totalNominais.toLocaleString('pt-BR')}</span>
                          <span>&bull;</span>
                          <span>Leg: {stats.totalLegenda.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Proportional Comparison Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Razão de Transferência (Prefeito / Vereadores):</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {stats.razao.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-indigo-600 h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (stats.votosPrefeito / (stats.votosPrefeito + stats.totalVereadores || 1)) * 100
                            )}%`,
                          }}
                          title={`Prefeito: ${stats.votosPrefeito}`}
                        />
                        <div
                          className="bg-blue-400 h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (stats.totalVereadores / (stats.votosPrefeito + stats.totalVereadores || 1)) * 100
                            )}%`,
                          }}
                          title={`Vereadores: ${stats.totalVereadores}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                          Prefeito ({((stats.votosPrefeito / (stats.votosPrefeito + stats.totalVereadores || 1)) * 100).toFixed(0)}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                          Vereadores ({((stats.totalVereadores / (stats.votosPrefeito + stats.totalVereadores || 1)) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    {/* Expandable Breakdown Button */}
                    <button
                      onClick={() => toggleCardBreakdown(col.id)}
                      className="w-full pt-1 text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>
                        {isExpanded
                          ? 'Ocultar detalhamento de votos por partido'
                          : 'Ver votos nominais e legenda por partido da aliança'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Expanded Breakdown Table */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-200 text-xs overflow-x-auto animate-in fade-in duration-150">
                        <table className="w-full text-left">
                          <thead className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="pb-1.5">Partido</th>
                              <th className="pb-1.5">Papel</th>
                              <th className="pb-1.5 text-right">Nominal</th>
                              <th className="pb-1.5 text-right">Legenda</th>
                              <th className="pb-1.5 text-right">Total</th>
                              <th className="pb-1.5 text-right">% Aliança</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {stats.partyStats.map((p) => {
                              const pctAlianca = stats.totalVereadores > 0
                                ? (p.total_votos / stats.totalVereadores) * 100
                                : 0;
                              return (
                                <tr key={p.sigla} className="hover:bg-slate-100/50">
                                  <td className="py-1.5 font-bold text-slate-900">{p.sigla}</td>
                                  <td className="py-1.5 text-[11px] text-slate-500">{p.papel}</td>
                                  <td className="py-1.5 text-right tabular-nums text-slate-700">
                                    {p.votos_nominais.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1.5 text-right tabular-nums text-slate-700">
                                    {p.votos_legenda.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1.5 text-right font-bold tabular-nums text-slate-900">
                                    {p.total_votos.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1.5 text-right font-mono text-[11px] text-slate-500">
                                    {pctAlianca.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Partidos que estavam apoiando */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        Partidos da Aliança ({col.partidos.length})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {col.partidos.map((membro) => {
                        const isTitular = membro.papel === 'Cabeça de Chapa';
                        const isVice = membro.papel === 'Vice-Prefeito';
                        return (
                          <div
                            key={membro.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                              isTitular
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : isVice
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span className="font-bold">{membro.sigla_partido}</span>
                            <span className="text-[10px] opacity-75">({membro.papel})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer with Composition string */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span className="truncate">
                    <span className="font-medium text-slate-700">Composição:</span> {col.composicao_siglas}
                  </span>
                  <span className="text-[11px] text-slate-400">ID #{col.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'paralelo' ? (
        /* DEDICATED PARALLEL COMPARISON VIEW (BAR CHARTS & COMPARATIVE METRICS) */
        <div className="space-y-6">
          {/* Chart Header Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  <span>Comparativo Gráfico: Votação do Prefeito vs. Votos Proporcionais de Vereadores</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Eleição de {selectedAno} &bull; Comparação direta entre os votos nominais da chapa majoritária e a força proporcional da soma dos partidos coligados (Nominais + Legenda).
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded text-indigo-800 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Votos Prefeito
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded text-sky-800 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Vereadores (Nominal)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded text-purple-800 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Vereadores (Legenda)
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: '#334155' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${Number(value).toLocaleString('pt-BR')} votos`,
                      name === 'votosPrefeito'
                        ? 'Votos Prefeito'
                        : name === 'votosNominais'
                        ? 'Vereadores (Nominal)'
                        : 'Vereadores (Legenda)',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    formatter={(value) =>
                      value === 'votosPrefeito'
                        ? 'Votos do Prefeito (Majoritário)'
                        : value === 'votosNominais'
                        ? 'Vereadores da Aliança (Votos Nominais)'
                        : 'Vereadores da Aliança (Votos de Legenda)'
                    }
                  />
                  <Bar dataKey="votosPrefeito" name="votosPrefeito" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="votosNominais" name="votosNominais" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="votosLegenda" name="votosLegenda" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coligacoes.map((c) => {
              const stats = getCoalitionCouncilStats(c);
              const isEleito = c.situacao?.toUpperCase().includes('ELEITO') && !c.situacao?.toUpperCase().includes('NÃO');

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Chapa Info */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                            {c.numero_urna}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base">
                            {c.candidato_nome || `Candidato ${c.numero_urna}`}
                          </h4>
                          {isEleito && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Eleito
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Coligação: <strong className="text-slate-800">{c.nome_coligacao}</strong> ({c.composicao_siglas})
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-indigo-700 tabular-nums">
                          {stats.votosPrefeito.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-slate-400">Votos do Prefeito</div>
                      </div>
                    </div>

                    {/* Comparative Thermometer */}
                    <div className="py-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Total de Votos dos Vereadores:</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {stats.totalVereadores.toLocaleString('pt-BR')} votos
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Saldo Eleitoral (Prefeito - Vereadores):</span>
                        <span className={`font-bold tabular-nums flex items-center gap-1 ${
                          stats.saldo >= 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {stats.saldo >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {stats.saldo >= 0 ? `+${stats.saldo.toLocaleString('pt-BR')}` : stats.saldo.toLocaleString('pt-BR')} votos
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Taxa de Coesão / Transferência:</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {stats.razao.toFixed(1)}%
                        </span>
                      </div>

                      {/* Visual meter */}
                      <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs">
                        <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Composição Proporcional da Coligação:</span>
                          <span className="text-slate-500 font-normal">
                            Nominais: <strong>{stats.totalNominais}</strong> | Legenda: <strong>{stats.totalLegenda}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-sky-500 h-full"
                            style={{
                              width: `${(stats.totalNominais / (stats.totalVereadores || 1)) * 100}%`,
                            }}
                            title={`Nominais: ${stats.totalNominais}`}
                          />
                          <div
                            className="bg-purple-500 h-full"
                            style={{
                              width: `${(stats.totalLegenda / (stats.totalVereadores || 1)) * 100}%`,
                            }}
                            title={`Legenda: ${stats.totalLegenda}`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                          <span>{((stats.totalNominais / (stats.totalVereadores || 1)) * 100).toFixed(0)}% Nominal</span>
                          <span>{((stats.totalLegenda / (stats.totalVereadores || 1)) * 100).toFixed(0)}% Legenda</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown by party table */}
                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Desempenho por Sigla Integrante:
                      </div>
                      <div className="space-y-1.5">
                        {stats.partyStats.map((p) => {
                          const pct = stats.totalVereadores > 0 ? (p.total_votos / stats.totalVereadores) * 100 : 0;
                          return (
                            <div
                              key={p.sigla}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 px-1.5 py-0.5 bg-white rounded border border-slate-200">
                                  {p.sigla}
                                </span>
                                <span className="text-[11px] text-slate-500">({p.papel})</span>
                              </div>
                              <div className="flex items-center gap-3 text-right tabular-nums">
                                <span className="text-slate-500 text-[11px]">
                                  {p.votos_nominais} nom. + {p.votos_legenda} leg.
                                </span>
                                <span className="font-bold text-slate-900">
                                  {p.total_votos} votos ({pct.toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Consolidated Comparative Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">
                Tabela Sintética do Paralelo Eleitoral ({selectedAno})
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Balanço consolidado entre o cargo majoritário e as bancadas proporcionais coligadas.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Chapa / Prefeito</th>
                    <th className="py-3 px-4">Partido Titular</th>
                    <th className="py-3 px-4 text-right">Votos Prefeito</th>
                    <th className="py-3 px-4 text-right">Vereadores (Nominal)</th>
                    <th className="py-3 px-4 text-right">Vereadores (Legenda)</th>
                    <th className="py-3 px-4 text-right">Total Vereadores</th>
                    <th className="py-3 px-4 text-right">Saldo (Dif.)</th>
                    <th className="py-3 px-4 text-right">Razão (Pref/Ver)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coligacoes.map((c) => {
                    const stats = getCoalitionCouncilStats(c);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {c.candidato_nome || `Chapa ${c.numero_urna}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-semibold text-xs border border-slate-200">
                            {c.sigla_partido_titular}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-indigo-700 tabular-nums">
                          {stats.votosPrefeito.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                          {stats.totalNominais.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                          {stats.totalLegenda.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900">
                          {stats.totalVereadores.toLocaleString('pt-BR')}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold tabular-nums ${
                          stats.saldo >= 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {stats.saldo >= 0 ? `+${stats.saldo.toLocaleString('pt-BR')}` : stats.saldo.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-800">
                          {stats.razao.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* MATRIX VIEW: Partidos x Candidatos que apoiavam */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">
              Matriz Comparativa de Apoios Políticos - Eleição {selectedAno}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Relação completa de todos os partidos registrados e a qual chapa/prefeito cada um declarou apoio oficial.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sigla do Partido</th>
                  <th className="py-3 px-4">Chapa / Prefeito Apoiado</th>
                  <th className="py-3 px-4">Papel na Aliança</th>
                  <th className="py-3 px-4">Número da Urna</th>
                  <th className="py-3 px-4">Nome da Coligação</th>
                  <th className="py-3 px-4 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todasSiglas.map((sigla) => {
                  // Find which coalition this party belonged to
                  const colig = coligacoes.find((c) =>
                    c.partidos.some((p) => matchPartidos(p.sigla_partido, sigla))
                  );
                  const membro = colig?.partidos.find((p) => matchPartidos(p.sigla_partido, sigla));
                  const isEleito = colig?.situacao?.toUpperCase().includes('ELEITO') && !colig?.situacao?.toUpperCase().includes('NÃO');

                  return (
                    <tr key={sigla} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                          {sigla}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {colig ? (
                          <div className="flex items-center gap-2">
                            <span>{colig.candidato_nome || `Candidato ${colig.numero_urna}`}</span>
                            <span className="text-xs text-slate-400">({colig.sigla_partido_titular})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Isolado / Não coligado</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {membro ? (
                          <span
                            className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${
                              membro.papel === 'Cabeça de Chapa'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : membro.papel === 'Vice-Prefeito'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {membro.papel}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 tabular-nums">
                        {colig?.numero_urna || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {colig?.nome_coligacao || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {colig ? (
                          isEleito ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Eleita
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Não eleita</span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {editingColigacao ? 'Editar Coligação Partidária' : 'Nova Coligação Partidária'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Eleição Municipal de {formAno} &bull; Braúnas/MG
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Ano da Eleição */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ano do Pleito *
                  </label>
                  <select
                    value={formAno}
                    onChange={(e) => setFormAno(Number(e.target.value))}
                    disabled={!!editingColigacao}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  >
                    {eleicoes.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número da Urna */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número na Urna *
                  </label>
                  <input
                    type="number"
                    value={formNumeroUrna}
                    onChange={(e) => setFormNumeroUrna(Number(e.target.value))}
                    required
                    min={10}
                    max={99}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                {/* Partido Titular */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sigla Titular (Cabeça) *
                  </label>
                  <input
                    type="text"
                    value={formSiglaTitular}
                    onChange={(e) => setFormSiglaTitular(e.target.value.toUpperCase())}
                    required
                    placeholder="Ex: PSD, PV, PSDB"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold uppercase"
                  />
                </div>
              </div>

              {/* Nome da Coligação */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Oficial da Coligação *
                </label>
                <input
                  type="text"
                  value={formNomeColigacao}
                  onChange={(e) => setFormNomeColigacao(e.target.value)}
                  required
                  placeholder="Ex: União por Braúnas, Juntos por uma Braúnas Melhor..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Seção de Partidos que compõem a Aliança */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Partidos que estavam apoiando esta chapa ({formPartidos.length})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Defina quem encabeça, quem é vice e os apoiadores
                  </span>
                </div>

                {/* Select from existing registered parties */}
                <div className="flex items-center gap-2 mb-3">
                  <select
                    id="select-add-partido"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddPartidoToForm(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">+ Selecionar partido para incluir na coligação...</option>
                    {partidosCadastrados
                      .filter((p) => !formPartidos.some((m) => m.sigla_partido === p.sigla))
                      .sort((a, b) => a.numero - b.numero)
                      .map((p) => (
                        <option key={p.id} value={p.sigla}>
                          Nº {p.numero} — {p.sigla} ({p.nome})
                        </option>
                      ))}
                  </select>
                </div>

                {/* List of members with roles */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formPartidos.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-400 text-center italic">
                      Nenhum partido adicionado à aliança ainda. Adicione pelo menos a legenda titular.
                    </div>
                  ) : (
                    formPartidos.map((membro) => (
                      <div
                        key={membro.sigla_partido}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 px-2 py-0.5 bg-white rounded border border-slate-200">
                            {membro.sigla_partido}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={membro.papel}
                            onChange={(e) => handleChangePapel(membro.sigla_partido, e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none"
                          >
                            <option value="Cabeça de Chapa">Cabeça de Chapa</option>
                            <option value="Vice-Prefeito">Vice-Prefeito</option>
                            <option value="Partido Apoiador">Partido Apoiador</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemovePartidoFromForm(membro.sigla_partido)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                >
                  {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingColigacao ? 'Salvar Alterações' : 'Criar Coligação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Soft Delete) */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Confirmar Exclusão</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Deseja realmente remover esta coligação partidária? O registro passará pelo processo de{' '}
              <strong className="text-slate-900">Soft Delete</strong> (desativado sem corromper o histórico do banco de dados).
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteColigacao(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
