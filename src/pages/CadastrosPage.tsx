import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Flag,
  Calendar,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
  Hash,
  ArrowRight,
} from 'lucide-react';
import {
  getCandidatosCadastrados,
  createCandidato,
  updateCandidato,
  deleteCandidato,
  getPartidosCadastrados,
  createPartido,
  updatePartido,
  deletePartido,
  getEleicoesCadastradas,
  createEleicao,
  deleteEleicao,
} from '../services/api';
import { PartidoCadastroDto, PartidoHistoricoDto } from '../types/election';
import { useAppRouter } from '../router/RouterContext';

type CadastroTab = 'candidatos' | 'partidos' | 'eleicoes';

interface CandidatoItem {
  titulo_eleitor: string;
  nome_completo: string;
  data_nascimento?: string | null;
  is_active: boolean;
  is_deleted: boolean;
}

export type PartidoItem = PartidoCadastroDto;

interface EleicaoItem {
  id: number;
  ano: number;
  is_active: boolean;
  is_deleted: boolean;
}

const PAGE_SIZE = 50;

export const CadastrosPage: React.FC = () => {
  const { openCandidato, navigate } = useAppRouter();
  const [activeTab, setActiveTab] = useState<CadastroTab>('candidatos');

  // Candidatos State
  const [candidatos, setCandidatos] = useState<CandidatoItem[]>([]);
  const [candidatosTotal, setCandidatosTotal] = useState<number>(0);
  const [candidatosSearch, setCandidatosSearch] = useState<string>('');
  const [candidatosPage, setCandidatosPage] = useState<number>(1);
  const [loadingCandidatos, setLoadingCandidatos] = useState<boolean>(true);

  // Partidos State
  const [partidos, setPartidos] = useState<PartidoItem[]>([]);
  const [partidosSearch, setPartidosSearch] = useState<string>('');
  const [partidosPage, setPartidosPage] = useState<number>(1);
  const [loadingPartidos, setLoadingPartidos] = useState<boolean>(false);

  // Eleições State
  const [eleicoes, setEleicoes] = useState<EleicaoItem[]>([]);
  const [eleicoesSearch, setEleicoesSearch] = useState<string>('');
  const [eleicoesPage, setEleicoesPage] = useState<number>(1);
  const [loadingEleicoes, setLoadingEleicoes] = useState<boolean>(false);

  // Modal States
  const [modalNovoCandidatoOpen, setModalNovoCandidatoOpen] = useState(false);
  const [modalEditarCandidatoOpen, setModalEditarCandidatoOpen] = useState(false);
  const [candidatoEditing, setCandidatoEditing] = useState<CandidatoItem | null>(null);

  const [modalNovoPartidoOpen, setModalNovoPartidoOpen] = useState(false);
  const [modalEditarPartidoOpen, setModalEditarPartidoOpen] = useState(false);
  const [partidoEditing, setPartidoEditing] = useState<PartidoItem | null>(null);

  const [modalNovaEleicaoOpen, setModalNovaEleicaoOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'candidato' | 'partido' | 'eleicao';
    id: string | number;
    title: string;
  } | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Form States
  const [formCandidato, setFormCandidato] = useState({
    titulo_eleitor: '',
    nome_completo: '',
    data_nascimento: '',
  });

  const [formEditCandidato, setFormEditCandidato] = useState({
    nome_completo: '',
    data_nascimento: '',
    is_active: true,
  });

  const [formPartido, setFormPartido] = useState<{
    numero: string;
    sigla: string;
    nome: string;
    historico: Array<{ sigla: string; nome: string; ano_inicio: string; ano_fim: string }>;
  }>({
    numero: '',
    sigla: '',
    nome: '',
    historico: [],
  });

  const [novoHistCriar, setNovoHistCriar] = useState({
    sigla: '',
    nome: '',
    ano_inicio: '',
    ano_fim: '',
  });

  const [formEditPartido, setFormEditPartido] = useState<{
    numero: string;
    sigla: string;
    nome: string;
    is_active: boolean;
    historico: Array<{ id?: number; sigla: string; nome: string; ano_inicio: string; ano_fim: string }>;
  }>({
    numero: '',
    sigla: '',
    nome: '',
    is_active: true,
    historico: [],
  });

  const [novoHistEditar, setNovoHistEditar] = useState({
    sigla: '',
    nome: '',
    ano_inicio: '',
    ano_fim: '',
  });

  const [formEleicao, setFormEleicao] = useState({
    ano: 2028,
    finalidade: 'Eleição Municipal Ordinária (Prefeito, Vice e Vereadores)',
    aptosEstimados: 4100,
  });

  // Fetch Candidatos with Pagination (max 50)
  const fetchCandidatos = async (search = candidatosSearch, page = candidatosPage) => {
    setLoadingCandidatos(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const res = await getCandidatosCadastrados({ search, limit: PAGE_SIZE, offset });
      setCandidatos(res.items);
      setCandidatosTotal(res.total);
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err?.message || 'Falha ao carregar candidatos.');
    } finally {
      setLoadingCandidatos(false);
    }
  };

  // Fetch Partidos
  const fetchPartidos = async () => {
    setLoadingPartidos(true);
    try {
      const res = await getPartidosCadastrados();
      setPartidos(res);
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err?.message || 'Falha ao carregar partidos.');
    } finally {
      setLoadingPartidos(false);
    }
  };

  // Fetch Eleições
  const fetchEleicoes = async () => {
    setLoadingEleicoes(true);
    try {
      const res = await getEleicoesCadastradas();
      setEleicoes(res);
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err?.message || 'Falha ao carregar eleições.');
    } finally {
      setLoadingEleicoes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'candidatos') {
      fetchCandidatos(candidatosSearch, candidatosPage);
    } else if (activeTab === 'partidos') {
      fetchPartidos();
    } else if (activeTab === 'eleicoes') {
      fetchEleicoes();
    }
  }, [activeTab, candidatosPage]);

  // Debounced search for candidatos (resets to page 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'candidatos') {
        setCandidatosPage(1);
        fetchCandidatos(candidatosSearch, 1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [candidatosSearch]);

  // Handle Create Candidato
  const handleCreateCandidato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidato.titulo_eleitor.trim() || !formCandidato.nome_completo.trim()) {
      showFeedback('error', 'Título de Eleitor e Nome Completo são obrigatórios.');
      return;
    }

    try {
      await createCandidato({
        titulo_eleitor: formCandidato.titulo_eleitor.trim(),
        nome_completo: formCandidato.nome_completo.trim(),
        data_nascimento: formCandidato.data_nascimento || null,
      });
      showFeedback('success', `Candidato ${formCandidato.nome_completo.toUpperCase()} cadastrado com sucesso!`);
      setFormCandidato({ titulo_eleitor: '', nome_completo: '', data_nascimento: '' });
      setModalNovoCandidatoOpen(false);
      fetchCandidatos(candidatosSearch, 1);
      setCandidatosPage(1);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao cadastrar candidato.');
    }
  };

  // Handle Edit Candidato
  const handleSaveEditCandidato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidatoEditing) return;

    try {
      await updateCandidato(candidatoEditing.titulo_eleitor, {
        nome_completo: formEditCandidato.nome_completo.trim(),
        data_nascimento: formEditCandidato.data_nascimento || null,
        is_active: formEditCandidato.is_active,
      });
      showFeedback('success', 'Registro do candidato atualizado com sucesso!');
      setModalEditarCandidatoOpen(false);
      setCandidatoEditing(null);
      fetchCandidatos(candidatosSearch, candidatosPage);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao atualizar dados do candidato.');
    }
  };

  // Handle Create Partido
  const handleCreatePartido = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(formPartido.numero, 10);
    if (isNaN(num) || num <= 0 || num > 99) {
      showFeedback('error', 'O Número Eleitoral deve ser um número válido de 2 dígitos (ex: 70, 15, 25).');
      return;
    }
    if (!formPartido.sigla.trim()) {
      showFeedback('error', 'A sigla do partido é obrigatória.');
      return;
    }
    if (!formPartido.nome.trim()) {
      showFeedback('error', 'O nome oficial do partido é obrigatório.');
      return;
    }

    try {
      await createPartido({
        numero: num,
        sigla: formPartido.sigla.trim().toUpperCase(),
        nome: formPartido.nome.trim(),
        historico: formPartido.historico.map((h) => ({
          sigla: h.sigla.trim().toUpperCase(),
          nome: h.nome?.trim() || undefined,
          ano_inicio: h.ano_inicio ? parseInt(h.ano_inicio, 10) : undefined,
          ano_fim: h.ano_fim ? parseInt(h.ano_fim, 10) : undefined,
        })),
      });
      showFeedback('success', `Partido Nº ${num} - ${formPartido.sigla.toUpperCase()} cadastrado com sucesso!`);
      setFormPartido({ numero: '', sigla: '', nome: '', historico: [] });
      setNovoHistCriar({ sigla: '', nome: '', ano_inicio: '', ano_fim: '' });
      setModalNovoPartidoOpen(false);
      fetchPartidos();
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao cadastrar partido.');
    }
  };

  // Handle Edit Partido
  const handleSaveEditPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoEditing) return;

    const num = parseInt(formEditPartido.numero, 10);
    if (isNaN(num) || num <= 0 || num > 99) {
      showFeedback('error', 'O Número Eleitoral deve ser um número válido de 2 dígitos (ex: 70, 15, 25).');
      return;
    }
    if (!formEditPartido.sigla.trim()) {
      showFeedback('error', 'A sigla do partido é obrigatória.');
      return;
    }
    if (!formEditPartido.nome.trim()) {
      showFeedback('error', 'O nome oficial do partido é obrigatório.');
      return;
    }

    try {
      await updatePartido(partidoEditing.id, {
        numero: num,
        sigla: formEditPartido.sigla.trim().toUpperCase(),
        nome: formEditPartido.nome.trim(),
        is_active: formEditPartido.is_active,
        historico: formEditPartido.historico.map((h) => ({
          id: h.id,
          sigla: h.sigla.trim().toUpperCase(),
          nome: h.nome?.trim() || undefined,
          ano_inicio: h.ano_inicio ? parseInt(String(h.ano_inicio), 10) : undefined,
          ano_fim: h.ano_fim ? parseInt(String(h.ano_fim), 10) : undefined,
        })),
      });
      showFeedback('success', `Partido Nº ${num} - ${formEditPartido.sigla.toUpperCase()} atualizado com sucesso!`);
      setModalEditarPartidoOpen(false);
      setPartidoEditing(null);
      fetchPartidos();
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao atualizar dados do partido.');
    }
  };

  // Handle Create Eleicao
  const handleCreateEleicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEleicao.ano || formEleicao.ano < 1980 || formEleicao.ano > 2060) {
      showFeedback('error', 'Informe um ano eleitoral válido entre 1980 e 2060.');
      return;
    }

    try {
      await createEleicao({ ano: Number(formEleicao.ano) });
      showFeedback('success', `Pleito municipal de ${formEleicao.ano} cadastrado com sucesso! Disponível em todo o sistema.`);
      setModalNovaEleicaoOpen(false);
      fetchEleicoes();
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao cadastrar eleição.');
    }
  };

  // Handle Soft Delete Execution
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'candidato') {
        await deleteCandidato(String(itemToDelete.id));
        showFeedback('success', `Candidato ${itemToDelete.title} desativado via Soft Delete.`);
        fetchCandidatos(candidatosSearch, candidatosPage);
      } else if (itemToDelete.type === 'partido') {
        await deletePartido(Number(itemToDelete.id));
        showFeedback('success', `Partido ${itemToDelete.title} desativado via Soft Delete.`);
        fetchPartidos();
      } else if (itemToDelete.type === 'eleicao') {
        await deleteEleicao(Number(itemToDelete.id));
        showFeedback('success', `Pleito ${itemToDelete.title} desativado via Soft Delete.`);
        fetchEleicoes();
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao processar exclusão.');
    } finally {
      setItemToDelete(null);
    }
  };

  // Pagination computations
  const totalCandidatosPages = Math.max(1, Math.ceil(candidatosTotal / PAGE_SIZE));
  const candidatosStartRecord = candidatosTotal === 0 ? 0 : (candidatosPage - 1) * PAGE_SIZE + 1;
  const candidatosEndRecord = Math.min(candidatosTotal, candidatosPage * PAGE_SIZE);

  // Partidos Filter & Pagination (pesquisa por número, sigla atual, nome oficial ou siglas históricas antigas como PTdoB, PMDB, etc)
  const filteredPartidos = useMemo(() => {
    if (!partidosSearch.trim()) return partidos;
    const term = partidosSearch.toLowerCase().trim();
    return partidos.filter((p) => {
      const matchNum = String(p.numero).includes(term);
      const matchSigla = p.sigla.toLowerCase().includes(term);
      const matchNome = (p.nome || '').toLowerCase().includes(term);
      const matchHist = (p.historico || []).some(
        (h) => h.sigla.toLowerCase().includes(term) || (h.nome || '').toLowerCase().includes(term)
      );
      return matchNum || matchSigla || matchNome || matchHist;
    });
  }, [partidos, partidosSearch]);

  const totalPartidosPages = Math.max(1, Math.ceil(filteredPartidos.length / PAGE_SIZE));
  const partidosPaginated = useMemo(() => {
    const start = (partidosPage - 1) * PAGE_SIZE;
    return filteredPartidos.slice(start, start + PAGE_SIZE);
  }, [filteredPartidos, partidosPage]);
  const partidosStartRecord = filteredPartidos.length === 0 ? 0 : (partidosPage - 1) * PAGE_SIZE + 1;
  const partidosEndRecord = Math.min(filteredPartidos.length, partidosPage * PAGE_SIZE);

  // Eleições Filter & Pagination
  const filteredEleicoes = useMemo(() => {
    if (!eleicoesSearch.trim()) return eleicoes;
    const term = eleicoesSearch.toLowerCase().trim();
    return eleicoes.filter((e) => String(e.ano).includes(term));
  }, [eleicoes, eleicoesSearch]);

  const totalEleicoesPages = Math.max(1, Math.ceil(filteredEleicoes.length / PAGE_SIZE));
  const eleicoesPaginated = useMemo(() => {
    const start = (eleicoesPage - 1) * PAGE_SIZE;
    return filteredEleicoes.slice(start, start + PAGE_SIZE);
  }, [filteredEleicoes, eleicoesPage]);
  const eleicoesStartRecord = filteredEleicoes.length === 0 ? 0 : (eleicoesPage - 1) * PAGE_SIZE + 1;
  const eleicoesEndRecord = Math.min(filteredEleicoes.length, eleicoesPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Administração & Cadastros
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Paginação (Máx 50 por página)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Gestão de Cadastros Eleitorais
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Inclusão, consulta, edição e manutenção de Pessoas Físicas (Candidatos), Siglas Partidárias e Pleitos Municipais (atuais e eleições futuras como 2028/2032).
          </p>
        </div>

        {/* Global Action Buttons - Accessible anytime */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalNovoCandidatoOpen(true)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer border ${
              activeTab === 'candidatos'
                ? 'bg-blue-700 hover:bg-blue-800 text-white border-blue-800'
                : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
            }`}
            title="Cadastrar nova Pessoa Física (Candidato)"
          >
            <Plus className="w-3.5 h-3.5" />
            <Users className="w-3.5 h-3.5 opacity-70" />
            <span>Adicionar Candidato</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoPartidoOpen(true)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer border ${
              activeTab === 'partidos'
                ? 'bg-blue-700 hover:bg-blue-800 text-white border-blue-800'
                : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
            }`}
            title="Cadastrar novo Partido Político"
          >
            <Plus className="w-3.5 h-3.5" />
            <Flag className="w-3.5 h-3.5 opacity-70" />
            <span>Adicionar Partido</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovaEleicaoOpen(true)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer border ${
              activeTab === 'eleicoes'
                ? 'bg-blue-700 hover:bg-blue-800 text-white border-blue-800'
                : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
            }`}
            title="Cadastrar Pleito para Eleições Futuras (ex: 2028, 2032)"
          >
            <Plus className="w-3.5 h-3.5" />
            <Calendar className="w-3.5 h-3.5 opacity-70" />
            <span>Adicionar Pleito (Futuro)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('candidatos')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'candidatos'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidatos (Pessoas Físicas)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono ml-1">
            {candidatosTotal}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('partidos')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'partidos'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Partidos Políticos</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono ml-1">
            {partidos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('eleicoes')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'eleicoes'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Pleitos / Eleições</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono ml-1">
            {eleicoes.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CANDIDATOS */}
      {/* ========================================================= */}
      {activeTab === 'candidatos' && (
        <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200/90 shadow-xs overflow-hidden -mt-6">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome civil ou título..."
                value={candidatosSearch}
                onChange={(e) => setCandidatosSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-slate-400"
              />
              {candidatosSearch && (
                <button
                  onClick={() => setCandidatosSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => fetchCandidatos(candidatosSearch, candidatosPage)}
                  className="p-1 text-slate-400 hover:text-blue-700 cursor-pointer"
                  title="Atualizar listagem"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCandidatos ? 'animate-spin text-blue-700' : ''}`} />
                </button>
                <span>
                  Mostrando <strong>{candidatosStartRecord}</strong>-<strong>{candidatosEndRecord}</strong> de <strong>{candidatosTotal}</strong> registros (50/pág)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setModalNovoCandidatoOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Candidato</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Título de Eleitor (PK)</th>
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">Data de Nascimento</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingCandidatos ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Carregando candidatos cadastrados...
                    </td>
                  </tr>
                ) : candidatos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Nenhum candidato encontrado para o termo pesquisado.
                    </td>
                  </tr>
                ) : (
                  candidatos.map((c) => (
                    <tr key={c.titulo_eleitor} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {c.titulo_eleitor}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.nome_completo}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {c.data_nascimento || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <XCircle className="w-3 h-3" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openCandidato(c.titulo_eleitor)}
                          className="p-1 rounded text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                          title="Visualizar Dossiê Histórico"
                        >
                          <ExternalLink className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => {
                            setCandidatoEditing(c);
                            setFormEditCandidato({
                              nome_completo: c.nome_completo,
                              data_nascimento: c.data_nascimento || '',
                              is_active: c.is_active,
                            });
                            setModalEditarCandidatoOpen(true);
                          }}
                          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Editar Cadastro"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'candidato',
                              id: c.titulo_eleitor,
                              title: `${c.nome_completo} (${c.titulo_eleitor})`,
                            })
                          }
                          className="p-1 rounded text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Soft Delete (Desativar)"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Candidatos (Max 50 items/page) */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Página <strong className="font-bold text-slate-900">{candidatosPage}</strong> de{' '}
              <strong className="font-bold text-slate-900">{totalCandidatosPages}</strong>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCandidatosPage(1)}
                disabled={candidatosPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Primeira Página"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCandidatosPage((prev) => Math.max(1, prev - 1))}
                disabled={candidatosPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Página Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 font-semibold text-slate-800">
                {candidatosPage} / {totalCandidatosPages}
              </span>

              <button
                onClick={() => setCandidatosPage((prev) => Math.min(totalCandidatosPages, prev + 1))}
                disabled={candidatosPage >= totalCandidatosPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Próxima Página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCandidatosPage(totalCandidatosPages)}
                disabled={candidatosPage >= totalCandidatosPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Última Página"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PARTIDOS */}
      {/* ========================================================= */}
      {activeTab === 'partidos' && (
        <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200/90 shadow-xs overflow-hidden -mt-6">
          {/* Partidos Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por número (ex: 70), sigla ou histórico (PTdoB, PMDB)..."
                value={partidosSearch}
                onChange={(e) => {
                  setPartidosSearch(e.target.value);
                  setPartidosPage(1);
                }}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-slate-400"
              />
              {partidosSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPartidosSearch('');
                    setPartidosPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => fetchPartidos()}
                  className="p-1 text-slate-400 hover:text-blue-700 cursor-pointer"
                  title="Recarregar listagem"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPartidos ? 'animate-spin text-blue-700' : ''}`} />
                </button>
                <span>
                  Mostrando <strong>{partidosStartRecord}</strong>-<strong>{partidosEndRecord}</strong> de <strong>{filteredPartidos.length}</strong> agremiações (50/pág)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormPartido({ numero: '', sigla: '', nome: '', historico: [] });
                  setNovoHistCriar({ sigla: '', nome: '', ano_inicio: '', ano_fim: '' });
                  setModalNovoPartidoOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Partido</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 text-center w-24">Nº TSE</th>
                  <th className="py-3 px-4 w-32">Sigla Atual</th>
                  <th className="py-3 px-4">Nome Oficial do Partido</th>
                  <th className="py-3 px-4">Histórico / Siglas Anteriores</th>
                  <th className="py-3 px-4 text-center w-24">Status</th>
                  <th className="py-3 px-4 text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingPartidos ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Carregando partidos...
                    </td>
                  </tr>
                ) : partidosPaginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhum partido cadastrado correspondente aos filtros.
                    </td>
                  </tr>
                ) : (
                  partidosPaginated.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center font-mono font-bold text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200">
                          {p.numero}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                          {p.sigla}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {p.nome || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {p.historico && p.historico.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {p.historico.map((h, hIdx) => (
                              <span
                                key={h.id || hIdx}
                                className="inline-flex items-center gap-1 text-[11px] font-mono bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200"
                                title={h.nome ? `${h.sigla} - ${h.nome}` : h.sigla}
                              >
                                <History className="w-3 h-3 text-amber-600" />
                                <strong>{h.sigla}</strong>
                                {(h.ano_inicio || h.ano_fim) && (
                                  <span className="text-[10px] text-amber-700">
                                    ({h.ano_inicio || '…'}–{h.ano_fim || '…'})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Sem alterações (denominação original)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <XCircle className="w-3 h-3" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setPartidoEditing(p);
                            setFormEditPartido({
                              numero: String(p.numero),
                              sigla: p.sigla,
                              nome: p.nome || '',
                              is_active: p.is_active ?? true,
                              historico: (p.historico || []).map((h) => ({
                                id: h.id,
                                sigla: h.sigla,
                                nome: h.nome || '',
                                ano_inicio: h.ano_inicio ? String(h.ano_inicio) : '',
                                ano_fim: h.ano_fim ? String(h.ano_fim) : '',
                              })),
                            });
                            setNovoHistEditar({ sigla: '', nome: '', ano_inicio: '', ano_fim: '' });
                            setModalEditarPartidoOpen(true);
                          }}
                          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Editar Partido e Histórico"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'partido',
                              id: p.id,
                              title: `Nº ${p.numero} (${p.sigla})`,
                            })
                          }
                          className="p-1 rounded text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Soft Delete (Desativar)"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Partidos */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Página <strong className="font-bold text-slate-900">{partidosPage}</strong> de{' '}
              <strong className="font-bold text-slate-900">{totalPartidosPages}</strong>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPartidosPage(1)}
                disabled={partidosPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Primeira Página"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPartidosPage((prev) => Math.max(1, prev - 1))}
                disabled={partidosPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Página Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 font-semibold text-slate-800">
                {partidosPage} / {totalPartidosPages}
              </span>

              <button
                onClick={() => setPartidosPage((prev) => Math.min(totalPartidosPages, prev + 1))}
                disabled={partidosPage >= totalPartidosPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Próxima Página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPartidosPage(totalPartidosPages)}
                disabled={partidosPage >= totalPartidosPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Última Página"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ELEIÇÕES */}
      {/* ========================================================= */}
      {activeTab === 'eleicoes' && (
        <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200/90 shadow-xs overflow-hidden -mt-6">
          {/* Future Elections & Planning Banner */}
          <div className="m-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-2.5">
              <Calendar className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900">Planejamento de Eleições Futuras & Séries Históricas:</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Cadastre novos pleitos (como <strong>2028</strong> ou <strong>2032</strong>) para habilitar o planejamento antecipado de candidaturas, projeção do eleitorado e cálculo do quociente eleitoral municipal de Braúnas/MG.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalNovaEleicaoOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Pleito (Futuro)</span>
            </button>
          </div>

          {/* Pleitos Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por ano eleitoral (ex: 2028)..."
                value={eleicoesSearch}
                onChange={(e) => {
                  setEleicoesSearch(e.target.value);
                  setEleicoesPage(1);
                }}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-slate-400 font-mono"
              />
              {eleicoesSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setEleicoesSearch('');
                    setEleicoesPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => fetchEleicoes()}
                  className="p-1 text-slate-400 hover:text-blue-700 cursor-pointer"
                  title="Recarregar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingEleicoes ? 'animate-spin text-blue-700' : ''}`} />
                </button>
                <span>
                  Mostrando <strong>{eleicoesStartRecord}</strong>-<strong>{eleicoesEndRecord}</strong> de <strong>{filteredEleicoes.length}</strong> pleitos registrados
                </span>
              </div>

              <button
                type="button"
                onClick={() => setModalNovaEleicaoOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Pleito</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Ano do Pleito</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingEleicoes ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Carregando eleições...
                    </td>
                  </tr>
                ) : eleicoesPaginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      Nenhuma eleição cadastrada.
                    </td>
                  </tr>
                ) : (
                  eleicoesPaginated.map((el) => (
                    <tr key={el.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {el.id}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm text-slate-900">
                        {el.ano}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {el.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <XCircle className="w-3 h-3" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => navigate(`#/pleito?ano=${el.ano}`)}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition cursor-pointer text-[11px]"
                        >
                          Ver Pleito
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'eleicao',
                              id: el.id,
                              title: `Eleição ${el.ano}`,
                            })
                          }
                          className="p-1 rounded text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Soft Delete (Desativar)"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Eleições */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Página <strong className="font-bold text-slate-900">{eleicoesPage}</strong> de{' '}
              <strong className="font-bold text-slate-900">{totalEleicoesPages}</strong>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setEleicoesPage(1)}
                disabled={eleicoesPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Primeira Página"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEleicoesPage((prev) => Math.max(1, prev - 1))}
                disabled={eleicoesPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Página Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 font-semibold text-slate-800">
                {eleicoesPage} / {totalEleicoesPages}
              </span>

              <button
                onClick={() => setEleicoesPage((prev) => Math.min(totalEleicoesPages, prev + 1))}
                disabled={eleicoesPage >= totalEleicoesPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Próxima Página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEleicoesPage(totalEleicoesPages)}
                disabled={eleicoesPage >= totalEleicoesPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Última Página"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: NOVO CANDIDATO */}
      {/* ========================================================= */}
      {modalNovoCandidatoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cadastrar Pessoa Física (Candidato)
                </h3>
              </div>
              <button
                onClick={() => setModalNovoCandidatoOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCandidato} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Users className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cadastro de Pessoa Física (Dados_Candidato): </span>
                  O Título de Eleitor é a Chave Primária (PK) única do indivíduo. Uma vez cadastrado, ele poderá concorrer como Prefeito, Vice ou Vereador em qualquer pleito.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título de Eleitor (PK - Máx 15 dígitos) *
                </label>
                <input
                  type="text"
                  maxLength={15}
                  required
                  placeholder="Ex: 086430000299"
                  value={formCandidato.titulo_eleitor}
                  onChange={(e) => setFormCandidato({ ...formCandidato, titulo_eleitor: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo (Civil) *
                </label>
                <input
                  type="text"
                  maxLength={255}
                  required
                  placeholder="Ex: WEYNE VIRGILIO DE CARVALHO"
                  value={formCandidato.nome_completo}
                  onChange={(e) => setFormCandidato({ ...formCandidato, nome_completo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data de Nascimento (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA ou AAAA-MM-DD"
                  value={formCandidato.data_nascimento}
                  onChange={(e) => setFormCandidato({ ...formCandidato, data_nascimento: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoCandidatoOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDITAR CANDIDATO */}
      {/* ========================================================= */}
      {modalEditarCandidatoOpen && candidatoEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Editar Cadastro do Candidato
                </h3>
              </div>
              <button
                onClick={() => setModalEditarCandidatoOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCandidato} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Título de Eleitor (Chave Primária)
                </label>
                <input
                  type="text"
                  disabled
                  value={candidatoEditing.titulo_eleitor}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formEditCandidato.nome_completo}
                  onChange={(e) => setFormEditCandidato({ ...formEditCandidato, nome_completo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  value={formEditCandidato.data_nascimento}
                  onChange={(e) => setFormEditCandidato({ ...formEditCandidato, data_nascimento: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk_is_active"
                  checked={formEditCandidato.is_active}
                  onChange={(e) => setFormEditCandidato({ ...formEditCandidato, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="chk_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Registro Ativo no Sistema (is_active)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarCandidatoOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: NOVO PARTIDO */}
      {/* ========================================================= */}
      {modalNovoPartidoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Flag className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cadastrar Novo Partido Político
                </h3>
              </div>
              <button
                onClick={() => setModalNovoPartidoOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePartido} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Hash className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Número Canônico do TSE como Fonte da Verdade: </span>
                  O número eleitoral (ex: 70, 15, 25) é a referência imutável da agremiação no TSE. O sistema mantém o histórico de renomeações e siglas passadas (ex: PTdoB → AVANTE) para que dados de eleições antigas se vinculem automaticamente.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nº TSE (Canônico) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={99}
                    required
                    placeholder="Ex: 70"
                    value={formPartido.numero}
                    onChange={(e) => setFormPartido({ ...formPartido, numero: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sigla Atual do Partido *
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    required
                    placeholder="Ex: AVANTE, MDB, PSD"
                    value={formPartido.sigla}
                    onChange={(e) => setFormPartido({ ...formPartido, sigla: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Oficial Registrado no TSE *
                </label>
                <input
                  type="text"
                  maxLength={150}
                  required
                  placeholder="Ex: Avante"
                  value={formPartido.nome}
                  onChange={(e) => setFormPartido({ ...formPartido, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Sub-form: Histórico de Denominações Anteriores */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-[11px]">
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    <span>Siglas Anteriores / Histórico (Ex: PTdoB, PMDB, PFL)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {formPartido.historico.length} registrada(s)
                  </span>
                </div>

                {/* Lista de siglas passadas cadastradas */}
                {formPartido.historico.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {formPartido.historico.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200 text-[11px]"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {h.sigla}
                          </span>
                          {h.nome && <span className="text-slate-600">{h.nome}</span>}
                          {(h.ano_inicio || h.ano_fim) && (
                            <span className="text-slate-400 text-[10px]">
                              ({h.ano_inicio || '…'} a {h.ano_fim || '…'})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormPartido({
                              ...formPartido,
                              historico: formPartido.historico.filter((_, i) => i !== idx),
                            });
                          }}
                          className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          title="Remover denominação anterior"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inputs para adicionar uma nova denominação anterior */}
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="text-[10px] font-semibold text-slate-600 uppercase">
                    Adicionar Denominação Passada:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Sigla (PTdoB)"
                        value={novoHistCriar.sigla}
                        onChange={(e) => setNovoHistCriar({ ...novoHistCriar, sigla: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono uppercase text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nome anterior"
                        value={novoHistCriar.nome}
                        onChange={(e) => setNovoHistCriar({ ...novoHistCriar, nome: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="De (ano)"
                        value={novoHistCriar.ano_inicio}
                        onChange={(e) => setNovoHistCriar({ ...novoHistCriar, ano_inicio: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Até (ano)"
                        value={novoHistCriar.ano_fim}
                        onChange={(e) => setNovoHistCriar({ ...novoHistCriar, ano_fim: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!novoHistCriar.sigla.trim()) {
                        showFeedback('error', 'Informe a sigla anterior antes de adicionar.');
                        return;
                      }
                      setFormPartido({
                        ...formPartido,
                        historico: [
                          ...formPartido.historico,
                          {
                            sigla: novoHistCriar.sigla.trim().toUpperCase(),
                            nome: novoHistCriar.nome.trim(),
                            ano_inicio: novoHistCriar.ano_inicio,
                            ano_fim: novoHistCriar.ano_fim,
                          },
                        ],
                      });
                      setNovoHistCriar({ sigla: '', nome: '', ano_inicio: '', ano_fim: '' });
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-[11px] transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar ao Histórico</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoPartidoOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Cadastrar Partido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3B: EDITAR PARTIDO */}
      {/* ========================================================= */}
      {modalEditarPartidoOpen && partidoEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Editar Partido Político & Histórico (Nº {partidoEditing.numero})
                </h3>
              </div>
              <button
                onClick={() => setModalEditarPartidoOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPartido} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nº TSE (Canônico) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={99}
                    required
                    value={formEditPartido.numero}
                    onChange={(e) => setFormEditPartido({ ...formEditPartido, numero: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sigla Atual *
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    required
                    value={formEditPartido.sigla}
                    onChange={(e) => setFormEditPartido({ ...formEditPartido, sigla: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Oficial Registrado no TSE *
                </label>
                <input
                  type="text"
                  maxLength={150}
                  required
                  value={formEditPartido.nome}
                  onChange={(e) => setFormEditPartido({ ...formEditPartido, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Sub-form: Histórico de Denominações Anteriores */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-[11px]">
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    <span>Siglas Anteriores / Histórico (Ex: PTdoB, PMDB, PFL)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {formEditPartido.historico.length} registrada(s)
                  </span>
                </div>

                {formEditPartido.historico.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {formEditPartido.historico.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200 text-[11px]"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {h.sigla}
                          </span>
                          {h.nome && <span className="text-slate-600">{h.nome}</span>}
                          {(h.ano_inicio || h.ano_fim) && (
                            <span className="text-slate-400 text-[10px]">
                              ({h.ano_inicio || '…'} a {h.ano_fim || '…'})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormEditPartido({
                              ...formEditPartido,
                              historico: formEditPartido.historico.filter((_, i) => i !== idx),
                            });
                          }}
                          className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          title="Remover denominação anterior"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="text-[10px] font-semibold text-slate-600 uppercase">
                    Adicionar Denominação Passada:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Sigla (ex: PTdoB)"
                        value={novoHistEditar.sigla}
                        onChange={(e) => setNovoHistEditar({ ...novoHistEditar, sigla: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono uppercase text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nome anterior"
                        value={novoHistEditar.nome}
                        onChange={(e) => setNovoHistEditar({ ...novoHistEditar, nome: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="De (ano)"
                        value={novoHistEditar.ano_inicio}
                        onChange={(e) => setNovoHistEditar({ ...novoHistEditar, ano_inicio: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Até (ano)"
                        value={novoHistEditar.ano_fim}
                        onChange={(e) => setNovoHistEditar({ ...novoHistEditar, ano_fim: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!novoHistEditar.sigla.trim()) {
                        showFeedback('error', 'Informe a sigla anterior antes de adicionar.');
                        return;
                      }
                      setFormEditPartido({
                        ...formEditPartido,
                        historico: [
                          ...formEditPartido.historico,
                          {
                            sigla: novoHistEditar.sigla.trim().toUpperCase(),
                            nome: novoHistEditar.nome.trim(),
                            ano_inicio: novoHistEditar.ano_inicio,
                            ano_fim: novoHistEditar.ano_fim,
                          },
                        ],
                      });
                      setNovoHistEditar({ sigla: '', nome: '', ano_inicio: '', ano_fim: '' });
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-[11px] transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar ao Histórico</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk_partido_active"
                  checked={formEditPartido.is_active}
                  onChange={(e) => setFormEditPartido({ ...formEditPartido, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="chk_partido_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Partido Ativo no Sistema (is_active)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarPartidoOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: NOVA ELEIÇÃO */}
      {/* ========================================================= */}
      {modalNovaEleicaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cadastrar Pleito Eleitoral (Eleição Futura)
                </h3>
              </div>
              <button
                onClick={() => setModalNovaEleicaoOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEleicao} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Calendar className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Planejamento e Registro Antecipado: </span>
                  Cadastre novos anos eleitorais (ex: <strong>2028</strong> ou <strong>2032</strong>). O pleito será integrado ao banco relacional (`Eleicao`), ficando disponível para simulação de quociente eleitoral, registro de chapas majoritárias e candidaturas a vereador.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ano da Eleição (Pleito Municipal) *
                </label>
                <input
                  type="number"
                  min={1980}
                  max={2060}
                  required
                  placeholder="Ex: 2028"
                  value={formEleicao.ano}
                  onChange={(e) => setFormEleicao({ ...formEleicao, ano: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Pleito
                </label>
                <input
                  type="text"
                  readOnly
                  value="Eleição Municipal Ordinária (Prefeito, Vice e Vereadores)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-600 cursor-default"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Eleitorado Estimado (Aptos)
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={formEleicao.aptosEstimados}
                    onChange={(e) => setFormEleicao({ ...formEleicao, aptosEstimados: parseInt(e.target.value, 10) || 4100 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cadeiras na Câmara
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="9 Vagas (Braúnas/MG)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-600 cursor-default font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovaEleicaoOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Cadastrar Pleito Eleitoral</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: CONFIRMAÇÃO DE SOFT DELETE */}
      {/* ========================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-red-100 bg-red-50 flex items-center space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-900">
                Confirmar Exclusão (Soft Delete Universal)
              </h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 font-medium">
                Deseja desativar o registro: <strong className="text-slate-900">{itemToDelete.title}</strong>?
              </p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Regra de Integridade Relacional:</strong> O registro será marcado com <code className="font-mono bg-amber-100 px-1 rounded">is_deleted = true</code> e <code className="font-mono bg-amber-100 px-1 rounded">is_active = false</code>. O histórico de votos e eleições não será corrompido.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Desativação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
