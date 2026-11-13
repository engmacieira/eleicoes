import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Sparkles,
  Users,
  Award,
  Vote,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  Scale,
  Percent,
  Layers,
  X,
  Building2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  getEleicoes,
  getParametrosQe,
  updateParametrosQe,
  getChapasProporcionais,
  createChapaProporcional,
  updateChapaProporcional,
  deleteChapaProporcional,
  gerarChapasIsoladas,
  getCalculoQe,
  getPartidosAno,
} from '../services/api';
import {
  EleicaoResumoDto,
  ParametrosQeDto,
  ChapaProporcionalDto,
  CalculoQeResponseDto,
  DesempenhoPartidoDto,
  ChapaConsolidadaQeDto,
  CandidatoQeDto,
  RodadaSobrasDto,
} from '../types/election';

export const QuocienteEleitoralPage: React.FC = () => {
  const [eleicoes, setEleicoes] = useState<EleicaoResumoDto[]>([]);
  const [selectedEleicaoId, setSelectedEleicaoId] = useState<number>(0);
  const [selectedAno, setSelectedAno] = useState<number>(2024);

  // Dados do Quociente e Chapas
  const [parametros, setParametros] = useState<ParametrosQeDto | null>(null);
  const [chapas, setChapas] = useState<ChapaProporcionalDto[]>([]);
  const [calculo, setCalculo] = useState<CalculoQeResponseDto | null>(null);
  const [partidosEleicao, setPartidosEleicao] = useState<DesempenhoPartidoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de UI
  const [isParamsModalOpen, setIsParamsModalOpen] = useState<boolean>(false);
  const [isChapaModalOpen, setIsChapaModalOpen] = useState<boolean>(false);
  const [editingChapa, setEditingChapa] = useState<ChapaProporcionalDto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedChapaId, setExpandedChapaId] = useState<number | null>(null);
  const [showMemoriaSobras, setShowMemoriaSobras] = useState<boolean>(false);

  // Form de Parâmetros
  const [formVagas, setFormVagas] = useState<number>(9);
  const [formPercQp, setFormPercQp] = useState<number>(10.0);
  const [formPercChapaSobras, setFormPercChapaSobras] = useState<number>(80.0);
  const [formPercCandSobras, setFormPercCandSobras] = useState<number>(20.0);
  const [formRepescagem, setFormRepescagem] = useState<boolean>(true);
  const [savingParams, setSavingParams] = useState<boolean>(false);

  // Form de Chapa
  const [formChapaNome, setFormChapaNome] = useState<string>('');
  const [formChapaTipo, setFormChapaTipo] = useState<string>('PARTIDO');
  const [formChapaPartidos, setFormChapaPartidos] = useState<number[]>([]);
  const [savingChapa, setSavingChapa] = useState<boolean>(false);

  // 1. Carregar lista de eleições disponíveis
  useEffect(() => {
    const fetchEleicoes = async () => {
      try {
        const list = await getEleicoes();
        const sorted = [...list].sort((a, b) => b.ano - a.ano);
        setEleicoes(sorted);
        if (sorted.length > 0) {
          const initial = sorted.find((e) => e.ano === 2024) || sorted[0];
          setSelectedEleicaoId(initial.id);
          setSelectedAno(initial.ano);
        }
      } catch (err) {
        console.error('Erro ao carregar eleições:', err);
        setErrorMsg('Não foi possível carregar a lista de eleições.');
      }
    };
    fetchEleicoes();
  }, []);

  // 2. Carregar dados da eleição selecionada
  const carregarDadosEleicao = async (eleicaoId: number, ano: number) => {
    if (!eleicaoId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Carregar parâmetros, chapas, cálculo e partidos com apuração
      const [paramsData, chapasList, calcData, partidosAnoData] = await Promise.all([
        getParametrosQe(eleicaoId).catch(() => null),
        getChapasProporcionais(eleicaoId).catch(() => []),
        getCalculoQe(eleicaoId).catch(() => null),
        getPartidosAno(ano).catch(() => ({ ano, partidos: [], total_geral_votos: 0 })),
      ]);

      setParametros(paramsData);
      if (paramsData) {
        setFormVagas(paramsData.vagas_vereador);
        setFormPercQp(paramsData.perc_minimo_candidato_qp);
        setFormPercChapaSobras(paramsData.perc_minimo_chapa_sobras);
        setFormPercCandSobras(paramsData.perc_minimo_candidato_sobras);
        setFormRepescagem(paramsData.permite_repescagem_sobras);
      }

      setChapas(chapasList);
      setCalculo(calcData);
      setPartidosEleicao(partidosAnoData.partidos);

      // Expandir o primeiro card por padrão se houver chapas
      if (calcData && calcData.chapas.length > 0 && expandedChapaId === null) {
        setExpandedChapaId(calcData.chapas[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do quociente:', err);
      setErrorMsg('Falha ao processar cálculo do Quociente Eleitoral.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEleicaoId > 0) {
      carregarDadosEleicao(selectedEleicaoId, selectedAno);
    }
  }, [selectedEleicaoId, selectedAno]);

  const handleMudarAno = (ano: number) => {
    const el = eleicoes.find((e) => e.ano === ano);
    if (el) {
      setSelectedEleicaoId(el.id);
      setSelectedAno(el.ano);
      setExpandedChapaId(null);
    }
  };

  // Salvar Parâmetros
  const handleSalvarParametros = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingParams(true);
    setErrorMsg(null);
    try {
      const updated = await updateParametrosQe(selectedEleicaoId, {
        vagas_vereador: Number(formVagas),
        perc_minimo_candidato_qp: Number(formPercQp),
        perc_minimo_chapa_sobras: Number(formPercChapaSobras),
        perc_minimo_candidato_sobras: Number(formPercCandSobras),
        permite_repescagem_sobras: formRepescagem,
      });
      setParametros(updated);
      setIsParamsModalOpen(false);
      setSuccessMsg('Regras e parâmetros eleitorais atualizados com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
      // Recarregar cálculo
      const novoCalculo = await getCalculoQe(selectedEleicaoId);
      setCalculo(novoCalculo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar parâmetros.';
      setErrorMsg(msg);
    } finally {
      setSavingParams(false);
    }
  };

  // Abrir Modal de Nova Chapa
  const handleOpenNovaChapaModal = () => {
    setEditingChapa(null);
    setFormChapaNome('');
    setFormChapaTipo('PARTIDO');
    setFormChapaPartidos([]);
    setIsChapaModalOpen(true);
  };

  // Abrir Modal de Edição de Chapa
  const handleOpenEditarChapaModal = (chapa: ChapaProporcionalDto) => {
    setEditingChapa(chapa);
    setFormChapaNome(chapa.nome);
    setFormChapaTipo(chapa.tipo);
    setFormChapaPartidos(chapa.partidos.map((p) => p.partido_id));
    setIsChapaModalOpen(true);
  };

  // Salvar Chapa (Criar ou Atualizar)
  const handleSalvarChapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChapaNome.trim()) {
      setErrorMsg('O nome da chapa é obrigatório.');
      return;
    }
    if (formChapaPartidos.length === 0) {
      setErrorMsg('Selecione ao menos um partido para a chapa.');
      return;
    }

    setSavingChapa(true);
    setErrorMsg(null);
    try {
      if (editingChapa) {
        await updateChapaProporcional(editingChapa.id, {
          nome: formChapaNome.trim(),
          tipo: formChapaTipo,
          partido_ids: formChapaPartidos,
        });
        setSuccessMsg(`Chapa "${formChapaNome}" atualizada com sucesso!`);
      } else {
        await createChapaProporcional(selectedEleicaoId, {
          nome: formChapaNome.trim(),
          tipo: formChapaTipo,
          partido_ids: formChapaPartidos,
        });
        setSuccessMsg(`Chapa "${formChapaNome}" cadastrada com sucesso!`);
      }
      setIsChapaModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      await carregarDadosEleicao(selectedEleicaoId, selectedAno);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar chapa.';
      setErrorMsg(msg);
    } finally {
      setSavingChapa(false);
    }
  };

  // Deletar Chapa
  const handleConfirmarExclusaoChapa = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteChapaProporcional(deleteConfirmId);
      setDeleteConfirmId(null);
      setSuccessMsg('Chapa removida com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await carregarDadosEleicao(selectedEleicaoId, selectedAno);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir chapa.';
      setErrorMsg(msg);
    }
  };

  // Ação rápida: Gerar Partidos Isolados
  const handleGerarPartidosIsolados = async () => {
    setLoading(true);
    try {
      await gerarChapasIsoladas(selectedEleicaoId);
      setSuccessMsg('Chapas individuais geradas para todos os partidos do pleito!');
      setTimeout(() => setSuccessMsg(null), 4000);
      await carregarDadosEleicao(selectedEleicaoId, selectedAno);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar chapas.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Partidos já vinculados a outras chapas
  const partidosVinculadosMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const ch of chapas) {
      if (editingChapa && ch.id === editingChapa.id) continue;
      for (const p of ch.partidos) {
        map.set(p.partido_id, ch.nome);
      }
    }
    return map;
  }, [chapas, editingChapa]);

  return (
    <div className="space-y-6">
      {/* Mensagens de Notificação */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. SELETOR DE ELEIÇÃO E BARRA DE CONTROLE (TOPO) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Quociente Eleitoral & Chapas Proporcionais
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                Vereador {selectedAno}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Motor determinístico de cálculo de Quociente Eleitoral (QE), Quociente Partidário (QP)
              e Distribuição de Sobras por Médias (Art. 106 a 109 do Código Eleitoral).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Pleito */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
              {eleicoes.map((el) => {
                const isSelected = el.ano === selectedAno;
                return (
                  <button
                    key={el.id}
                    onClick={() => handleMudarAno(el.ano)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {el.ano}
                  </button>
                );
              })}
            </div>

            {/* Botão de Parâmetros da Regra Eleitoral */}
            <button
              onClick={() => setIsParamsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Configurar vagas e cláusulas percentuais de corte"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span>Regras & Parâmetros</span>
            </button>

            {/* Botão Atualizar */}
            <button
              onClick={() => carregarDadosEleicao(selectedEleicaoId, selectedAno)}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Recarregar cálculo"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CARDS DE KPIS DO QUOCIENTE ELEITORAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Votos Válidos */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Votos Válidos</span>
            <Vote className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {calculo ? calculo.total_votos_validos.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span>{calculo ? `${calculo.total_votos_nominais} nom.` : '0'}</span>
            <span>+</span>
            <span>{calculo ? `${calculo.total_votos_legenda} leg.` : '0'}</span>
          </div>
        </div>

        {/* KPI 2: Vagas em Disputa */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Vagas em Disputa</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {calculo ? `${calculo.vagas_vereador} cadeiras` : '9 cadeiras'}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            Câmara Municipal de Braúnas
          </div>
        </div>

        {/* KPI 3: Quociente Eleitoral (QE) */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-blue-200 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Quociente Eleitoral</span>
            <Calculator className="w-4 h-4 text-blue-200" />
          </div>
          <div className="text-3xl font-black tracking-tight">
            {calculo ? calculo.qe_arredondado.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-[11px] text-blue-200 mt-1 font-medium">
            {calculo ? `Exato: ${calculo.qe_exato.toFixed(4)}` : 'Arredondamento TSE'}
          </div>
        </div>

        {/* KPI 4: Cláusulas de Barreira (Cortes) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Cláusulas de Barreira</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="space-y-1 mt-1 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500 font-medium">10% QP Cand:</span>
              <strong className="font-bold text-slate-900">
                {calculo ? `${calculo.corte_10_qp} votos` : '—'}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500 font-medium">80% Sobras Chapa:</span>
              <strong className="font-bold text-slate-900">
                {calculo ? `${calculo.corte_80_chapa} votos` : '—'}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500 font-medium">20% Sobras Cand:</span>
              <strong className="font-bold text-slate-900">
                {calculo ? `${calculo.corte_20_sobras} votos` : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 5: Resumo do Preenchimento */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Distribuição</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {calculo
              ? `${calculo.total_vagas_qp_distribuidas + calculo.total_vagas_media_distribuidas} / ${calculo.vagas_vereador}`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2 font-medium">
            <span className="text-emerald-700 font-bold">
              {calculo?.total_vagas_qp_distribuidas || 0} QP
            </span>
            <span>+</span>
            <span className="text-blue-700 font-bold">
              {calculo?.total_vagas_media_distribuidas || 0} Médias
            </span>
          </div>
        </div>
      </div>

      {/* 3. GESTÃO DE CHAPAS PROPORCIONAIS DO PLEITO */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>Chapas Proporcionais da Eleição {selectedAno}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                {chapas.length} cadastradas
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina os Partidos Isolados, Coligações ou Federações que disputaram as vagas de
              Vereador neste ano.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGerarPartidosIsolados}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-300 shadow-xs"
              title="Cria automaticamente 1 chapa para cada partido com votos no pleito que ainda não está vinculado"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Gerar Partidos Isolados Automaticamente</span>
            </button>
            <button
              onClick={handleOpenNovaChapaModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Chapa Proporcional</span>
            </button>
          </div>
        </div>

        {/* Lista visual resumida das chapas existentes com botões de ação */}
        {chapas.length === 0 ? (
          <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhuma chapa proporcional cadastrada para o pleito de {selectedAno}.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Clique em <strong>"Gerar Partidos Isolados Automaticamente"</strong> para importar
              todas as legendas que disputaram vereador neste ano ou crie coligações/federações manualmente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {chapas.map((ch) => (
              <div
                key={ch.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition shadow-2xs flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 tracking-tight">
                      {ch.nome}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ch.tipo === 'COLIGACAO'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : ch.tipo === 'FEDERACAO'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {ch.tipo}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {ch.partidos.map((p) => (
                      <span
                        key={p.partido_id}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 shadow-2xs"
                      >
                        <span className="font-mono text-slate-400 text-[10px]">{p.numero}</span>
                        <span>{p.sigla}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => handleOpenEditarChapaModal(ch)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Editar chapa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(ch.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Remover chapa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. QUADRO COMPARATIVO GERAL DAS CHAPAS (TABELA RESUMO) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-700" />
              <span>Quadro Comparativo de Distribuição de Cadeiras</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidação de votos nominais, votos de legenda, Quociente Partidário e vagas por média.
            </p>
          </div>

          {calculo && calculo.memoria_sobras.length > 0 && (
            <button
              onClick={() => setShowMemoriaSobras(!showMemoriaSobras)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {showMemoriaSobras ? 'Ocultar Memória de Médias' : 'Ver Memória de Cálculo das Sobras'}
              </span>
            </button>
          )}
        </div>

        {/* Memória de Cálculo das Sobras Retrátil */}
        {showMemoriaSobras && calculo && calculo.memoria_sobras.length > 0 && (
          <div className="p-5 bg-indigo-50/50 border-b border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-indigo-700" />
              <span>Passo a Passo da Distribuição das Sobras (Art. 109 CE)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {calculo.memoria_sobras.map((s) => (
                <div
                  key={s.rodada}
                  className="p-3 bg-white border border-indigo-200 rounded-xl shadow-2xs text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-900">
                      {s.rodada}ª Vaga de Sobra
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        s.fase === '80/20'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {s.fase === '80/20' ? 'Regra 80/20' : 'Repescagem Universal'}
                    </span>
                  </div>
                  <div className="text-slate-800">
                    Chapa Vencedora: <strong>{s.chapa_nome}</strong>
                  </div>
                  <div className="text-slate-600 flex items-center justify-between">
                    <span>Média Obtida:</span>
                    <strong className="font-mono text-indigo-700">{s.media.toFixed(2)}</strong>
                  </div>
                  <div className="text-slate-700 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Candidato Eleito:</span>
                    <strong className="text-blue-900">{s.candidato_nome} ({s.candidato_votos} votos)</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabela Comparativa */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Partido / Coligação / Federação</th>
                <th className="py-3 px-3 text-right">Nominais</th>
                <th className="py-3 px-3 text-right">Legenda</th>
                <th className="py-3 px-3 text-right">Votos Válidos</th>
                <th className="py-3 px-3 text-right">% Votos</th>
                <th className="py-3 px-3 text-center">Vagas QP</th>
                <th className="py-3 px-3 text-center">Eleitos QP</th>
                <th className="py-3 px-3 text-center">Eleitos Média</th>
                <th className="py-3 px-3 text-center font-extrabold text-blue-900">Total Cadeiras</th>
                <th className="py-3 px-4 text-center">Média Final / 80% QE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {!calculo || calculo.chapas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Nenhum dado calculado para exibição.
                  </td>
                </tr>
              ) : (
                calculo.chapas.map((ch) => {
                  const isExpanded = expandedChapaId === ch.id;
                  return (
                    <tr
                      key={ch.id}
                      onClick={() => setExpandedChapaId(isExpanded ? null : ch.id)}
                      className={`hover:bg-blue-50/50 transition cursor-pointer ${
                        ch.total_eleitos > 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button className="text-slate-400 hover:text-blue-600">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <span className="font-bold text-slate-900">{ch.nome}</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {ch.partidos.map((p) => (
                                <span
                                  key={p.partido_id}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium"
                                >
                                  {p.sigla}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {ch.votos_nominais.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {ch.votos_legenda.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {ch.votos_validos_total.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {ch.percentual_votos_validos.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600 font-bold">
                        {ch.vagas_qp}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ch.eleitos_qp > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {ch.eleitos_qp}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ch.eleitos_media > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                            {ch.eleitos_media}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[28px] px-2.5 py-1 rounded-lg font-black text-sm ${
                            ch.total_eleitos > 0
                              ? 'bg-blue-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {ch.total_eleitos}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ch.atingiu_80_qe
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {ch.atingiu_80_qe ? '>= 80% QE' : '< 80% QE'}
                          </span>
                          <span className="font-mono text-xs text-slate-500 font-semibold">
                            (Média {ch.media_final.toFixed(1)})
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RANKING INTERNO DE CANDIDATOS POR CHAPA (ACORDEÕES EXPANSÍVEIS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <span>Ranking Interno de Candidatos por Chapa</span>
            </h3>
            <p className="text-xs text-slate-500">
              Classificação por votos nominais, verificação das barreiras de 10% e 20% do QE e
              status de eleição (QP, Média ou Suplente).
            </p>
          </div>
        </div>

        {calculo &&
          calculo.chapas.map((ch) => {
            const isExpanded = expandedChapaId === ch.id;
            return (
              <div
                key={ch.id}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Cabeçalho do Acordeão */}
                <div
                  onClick={() => setExpandedChapaId(isExpanded ? null : ch.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl flex items-center justify-center font-bold text-sm ${
                        ch.total_eleitos > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{ch.nome}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {ch.tipo}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>
                          {ch.votos_validos_total.toLocaleString('pt-BR')} votos válidos (
                          {ch.percentual_votos_validos.toFixed(1)}%)
                        </span>
                        <span>•</span>
                        <span>{ch.ranking_candidatos.length} candidatos</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">
                        {ch.total_eleitos} {ch.total_eleitos === 1 ? 'Cadeira' : 'Cadeiras'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {ch.eleitos_qp} por QP • {ch.eleitos_media} por Média
                      </div>
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Conteúdo Expansível: Lista de Candidatos */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/40 space-y-3">
                    {ch.ranking_candidatos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Nenhum candidato registrado para esta chapa.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 text-center">Pos.</th>
                              <th className="py-2.5 px-3">Candidato (Nome de Urna)</th>
                              <th className="py-2.5 px-3">Partido</th>
                              <th className="py-2.5 px-3 text-right">Votos Nominais</th>
                              <th className="py-2.5 px-3 text-right">% do QE</th>
                              <th className="py-2.5 px-3 text-center">10% QE (QP)</th>
                              <th className="py-2.5 px-3 text-center">20% QE (Sobras)</th>
                              <th className="py-2.5 px-4 text-center">Resultado Calculado</th>
                              <th className="py-2.5 px-3 text-center">Oficial TSE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 bg-white">
                            {ch.ranking_candidatos.map((cand) => (
                              <tr
                                key={cand.titulo_eleitor}
                                className={`hover:bg-blue-50/30 transition ${
                                  cand.status_calculado === 'ELEITO_QP'
                                    ? 'bg-emerald-50/40'
                                    : cand.status_calculado === 'ELEITO_MEDIA'
                                    ? 'bg-blue-50/40'
                                    : ''
                                }`}
                              >
                                <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                  {cand.posicao_ranking}º
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900">{cand.nome_urna}</div>
                                  <div className="text-[10px] text-slate-500">{cand.nome_completo}</div>
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-700">
                                  <span className="font-mono text-slate-400 text-[11px] mr-1">
                                    {cand.numero_urna}
                                  </span>
                                  {cand.sigla_partido}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  {cand.votos.toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                  {cand.percentual_qe.toFixed(1)}%
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      cand.atingiu_10_qp
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {cand.atingiu_10_qp ? 'Sim' : 'Não'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      cand.atingiu_20_sobras
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {cand.atingiu_20_sobras ? 'Sim' : 'Não'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  {cand.status_calculado === 'ELEITO_QP' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] shadow-2xs">
                                      <CheckCircle2 className="w-3 h-3" /> Eleito por QP
                                    </span>
                                  )}
                                  {cand.status_calculado === 'ELEITO_MEDIA' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[11px] shadow-2xs">
                                      <CheckCircle2 className="w-3 h-3" /> Eleito por Média
                                    </span>
                                  )}
                                  {cand.status_calculado === 'SUPLENTE' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[11px]">
                                      Suplente
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      cand.coincide_oficial
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                    }`}
                                    title={`Situação oficial registrada no TSE: ${cand.situacao_oficial}`}
                                  >
                                    {cand.situacao_oficial}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* MODAL: PARÂMETROS DA REGRA ELEITORAL */}
      {isParamsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-base text-slate-900">
                  Parâmetros da Regra Eleitoral ({selectedAno})
                </h3>
              </div>
              <button
                onClick={() => setIsParamsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarParametros} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vagas de Vereador em Disputa (Câmara Municipal)
                </label>
                <input
                  type="number"
                  min={1}
                  max={55}
                  value={formVagas}
                  onChange={(e) => setFormVagas(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-blue-600"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Padrão em Braúnas/MG: 9 cadeiras.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Corte Candidato QP (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={formPercQp}
                    onChange={(e) => setFormPercQp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-blue-600"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Exige 10% do QE de votos nominais.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Corte Chapa Sobras (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={formPercChapaSobras}
                    onChange={(e) => setFormPercChapaSobras(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-blue-600"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Exige 80% do QE da chapa na 1ª fase.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Corte Candidato Sobras (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={formPercCandSobras}
                    onChange={(e) => setFormPercCandSobras(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-blue-600"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Exige 20% do QE do candidato na 1ª fase.
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer pt-3">
                    <input
                      type="checkbox"
                      checked={formRepescagem}
                      onChange={(e) => setFormRepescagem(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Permitir Repescagem Universal</span>
                  </label>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Se sobrarem vagas, disputa aberta a todas as chapas.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsParamsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingParams}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer"
                >
                  {savingParams ? 'Salvando...' : 'Salvar & Recalcular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE CHAPA PROPORCIONAL */}
      {isChapaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingChapa ? 'Editar Chapa Proporcional' : 'Nova Chapa Proporcional'}
                </h3>
              </div>
              <button
                onClick={() => setIsChapaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarChapa} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome da Chapa / Sigla
                </label>
                <input
                  type="text"
                  placeholder="Ex: MDB, Federação Brasil da Esperança, Coligação Por Braúnas"
                  value={formChapaNome}
                  onChange={(e) => setFormChapaNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo da Unidade</label>
                <select
                  value={formChapaTipo}
                  onChange={(e) => setFormChapaTipo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-blue-600"
                >
                  <option value="PARTIDO">Partido Isolado</option>
                  <option value="COLIGACAO">Coligação Proporcional</option>
                  <option value="FEDERACAO">Federação Partidária</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Selecione os Partidos Integrantes nesta Eleição ({selectedAno})
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Um mesmo partido só pode participar de uma única chapa no mesmo pleito.
                </p>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                  {partidosEleicao.length === 0 ? (
                    <p className="text-slate-400 text-center py-2">
                      Nenhum partido localizado na apuração deste ano.
                    </p>
                  ) : (
                    partidosEleicao.map((p) => {
                      const pNum = p.numero || 0;
                      const isSelected = formChapaPartidos.includes(pNum);
                      const outroVinculo = partidosVinculadosMap.get(pNum);
                      const isBlocked = !!outroVinculo;

                      return (
                        <label
                          key={pNum}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                            isBlocked
                              ? 'opacity-50 cursor-not-allowed bg-slate-100'
                              : isSelected
                              ? 'bg-blue-100/70 border border-blue-300 text-blue-900'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              disabled={isBlocked}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormChapaPartidos([...formChapaPartidos, pNum]);
                                } else {
                                  setFormChapaPartidos(formChapaPartidos.filter((n) => n !== pNum));
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600"
                            />
                            <div>
                              <span className="font-bold text-slate-900">
                                {p.sigla} ({pNum})
                              </span>
                              <span className="text-[11px] text-slate-500 ml-2">
                                {p.total_votos} votos ({p.votos_nominais} nom. + {p.votos_legenda} leg.)
                              </span>
                            </div>
                          </div>

                          {isBlocked && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Já em: {outroVinculo}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChapaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingChapa}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer"
                >
                  {savingChapa ? 'Salvando...' : 'Salvar Chapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE CHAPA */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-3">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-full w-fit">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Remover Chapa Proporcional?</h3>
            <p className="text-xs text-slate-500">
              Esta ação removerá a chapa proporcional e liberará os partidos membros para vinculação
              a outras chapas deste pleito.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusaoChapa}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
