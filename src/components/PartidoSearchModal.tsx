import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Building2,
  CheckCircle2,
  History,
  Sparkles,
  Layers,
  ArrowRight,
  Trash2,
  Calendar,
  Info,
  Check,
  Tag,
} from 'lucide-react';
import { PartidoCadastroDto } from '../types/election';
import { getDenominacaoNoAno } from '../services/api';

interface PartidoSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  partidosCadastrados: PartidoCadastroDto[];
  anoEleicao: number;
  partidosSelecionados: Array<{
    sigla_partido: string;
    papel: string;
    id_partido?: number;
  }>;
  onAddPartido: (partido: PartidoCadastroDto, papel: string) => void;
  onRemovePartido: (sigla: string) => void;
  onChangePapel?: (sigla: string, novoPapel: string) => void;
}

interface MatchDetail {
  tipo: 'numero' | 'sigla_atual' | 'nome_atual' | 'sigla_antiga' | 'nome_antigo';
  termoCorrespondente: string;
  detalheHistorico?: {
    sigla: string;
    nome?: string;
    ano_inicio?: number;
    ano_fim?: number;
  };
}

export const PartidoSearchModal: React.FC<PartidoSearchModalProps> = ({
  isOpen,
  onClose,
  partidosCadastrados,
  anoEleicao,
  partidosSelecionados,
  onAddPartido,
  onRemovePartido,
  onChangePapel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'todos' | 'disponiveis' | 'com_historico' | 'selecionados'>('todos');
  const [papelMap, setPapelMap] = useState<Record<string, string>>({});
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto focus no campo de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
      setFilterTab('todos');
      setRecentlyAdded(null);
    }
  }, [isOpen]);

  // Remove animação de recentlyAdded após 1.5s
  useEffect(() => {
    if (recentlyAdded) {
      const timer = setTimeout(() => setRecentlyAdded(null), 1800);
      return () => clearTimeout(timer);
    }
  }, [recentlyAdded]);

  // Normalizador de texto para busca sem acentos
  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Processamento e indexação de busca para os partidos
  const resultados = useMemo(() => {
    const rawSearch = searchTerm.trim();
    const cleanSearch = normalize(rawSearch);
    const searchNoSpaces = cleanSearch.replace(/\s+/g, '');
    const isNumeric = /^\d+$/.test(rawSearch);

    const list = partidosCadastrados.map((p) => {
      const estaSelecionado = partidosSelecionados.some(
        (m) => m.sigla_partido.toUpperCase() === p.sigla.toUpperCase()
      );
      const membroAtual = partidosSelecionados.find(
        (m) => m.sigla_partido.toUpperCase() === p.sigla.toUpperCase()
      );

      // Denominação histórica vigente no ano do pleito selecionado
      const denomNoAno = getDenominacaoNoAno(p, anoEleicao);

      // Verificação de matches e detecção de denominação antiga
      let isMatch = false;
      let matchDetail: MatchDetail | null = null;

      if (!rawSearch) {
        isMatch = true;
      } else {
        // 1. Busca por número
        if (isNumeric) {
          if (String(p.numero).startsWith(rawSearch)) {
            isMatch = true;
            matchDetail = { tipo: 'numero', termoCorrespondente: `Nº ${p.numero}` };
          }
        }

        // 2. Busca por sigla atual
        if (!isMatch) {
          const siglaClean = normalize(p.sigla).replace(/\s+/g, '');
          if (siglaClean.includes(searchNoSpaces)) {
            isMatch = true;
            matchDetail = { tipo: 'sigla_atual', termoCorrespondente: p.sigla };
          }
        }

        // 3. Busca por nome atual oficial
        if (!isMatch && p.nome) {
          if (normalize(p.nome).includes(cleanSearch)) {
            isMatch = true;
            matchDetail = { tipo: 'nome_atual', termoCorrespondente: p.nome };
          }
        }

        // 4. Busca por nomes antigos e siglas antigas no histórico
        if (!isMatch && p.historico && p.historico.length > 0) {
          for (const h of p.historico) {
            const hSiglaClean = normalize(h.sigla).replace(/\s+/g, '');
            const hNomeClean = h.nome ? normalize(h.nome) : '';

            // Match na sigla histórica
            if (hSiglaClean.includes(searchNoSpaces)) {
              isMatch = true;
              matchDetail = {
                tipo: 'sigla_antiga',
                termoCorrespondente: h.sigla,
                detalheHistorico: {
                  sigla: h.sigla,
                  nome: h.nome,
                  ano_inicio: h.ano_inicio,
                  ano_fim: h.ano_fim,
                },
              };
              break;
            }

            // Match no nome histórico por extenso
            if (hNomeClean && hNomeClean.includes(cleanSearch)) {
              isMatch = true;
              matchDetail = {
                tipo: 'nome_antigo',
                termoCorrespondente: h.nome || h.sigla,
                detalheHistorico: {
                  sigla: h.sigla,
                  nome: h.nome,
                  ano_inicio: h.ano_inicio,
                  ano_fim: h.ano_fim,
                },
              };
              break;
            }
          }
        }

        // 5. Busca por siglas_anteriores diretas
        if (!isMatch && p.siglas_anteriores) {
          for (const s of p.siglas_anteriores) {
            if (normalize(s).replace(/\s+/g, '').includes(searchNoSpaces)) {
              isMatch = true;
              matchDetail = {
                tipo: 'sigla_antiga',
                termoCorrespondente: s,
              };
              break;
            }
          }
        }
      }

      // Possui histórico de redenominações ou fusões
      const temHistorico =
        (p.historico && p.historico.length > 1) ||
        (p.siglas_anteriores && p.siglas_anteriores.length > 0);

      return {
        partido: p,
        isMatch,
        matchDetail,
        estaSelecionado,
        membroAtual,
        denomNoAno,
        temHistorico,
      };
    });

    // Filtrar apenas os que deram match
    let filtered = list.filter((item) => item.isMatch);

    // Aplicar tab de filtro secundária
    if (filterTab === 'disponiveis') {
      filtered = filtered.filter((item) => !item.estaSelecionado);
    } else if (filterTab === 'com_historico') {
      filtered = filtered.filter((item) => item.temHistorico);
    } else if (filterTab === 'selecionados') {
      filtered = filtered.filter((item) => item.estaSelecionado);
    }

    // Ordenação: primeiro os que deram match direto em nome antigo se houve pesquisa, depois por número eleitoral
    return filtered.sort((a, b) => {
      if (searchTerm) {
        const aHistMatch = a.matchDetail?.tipo === 'nome_antigo' || a.matchDetail?.tipo === 'sigla_antiga' ? 1 : 0;
        const bHistMatch = b.matchDetail?.tipo === 'nome_antigo' || b.matchDetail?.tipo === 'sigla_antiga' ? 1 : 0;
        if (aHistMatch !== bHistMatch) return bHistMatch - aHistMatch;
      }
      return a.partido.numero - b.partido.numero;
    });
  }, [partidosCadastrados, partidosSelecionados, searchTerm, filterTab, anoEleicao]);

  // Contadores para as tabs
  const counts = useMemo(() => {
    const total = partidosCadastrados.length;
    const selecionados = partidosSelecionados.length;
    const disponiveis = total - selecionados;
    const comHistorico = partidosCadastrados.filter(
      (p) => (p.historico && p.historico.length > 1) || (p.siglas_anteriores && p.siglas_anteriores.length > 0)
    ).length;
    return { total, selecionados, disponiveis, comHistorico };
  }, [partidosCadastrados, partidosSelecionados]);

  // Handler para adicionar partido com papel escolhido
  const handleAdd = (partido: PartidoCadastroDto) => {
    const papelDefault =
      partidosSelecionados.length === 0
        ? 'Cabeça de Chapa'
        : partidosSelecionados.length === 1
        ? 'Vice-Prefeito'
        : 'Partido Apoiador';

    const papel = papelMap[partido.sigla] || papelDefault;
    onAddPartido(partido, papel);
    setRecentlyAdded(partido.sigla);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl shadow-sm flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Localizar e Adicionar Partidos
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Pleito {anoEleicao}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pesquise por <strong>número eleitoral</strong>, <strong>nome atual oficial</strong> ou por{' '}
                <strong className="text-amber-700">nomes e siglas antigas</strong> (ex: PMDB, PFL, DEM, PRB, PPS, etc.)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BAR & CHIPS */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o número (15), nome atual (MDB), ou nome antigo (PMDB, PFL, Democratas, PRB, PPS)..."
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tags / Historical Aliases Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Exemplos de busca:
            </span>
            {[
              { label: 'PMDB (Nº 15)', term: 'PMDB' },
              { label: 'PFL / DEM (Nº 25)', term: 'DEM' },
              { label: 'PRB (Nº 10)', term: 'PRB' },
              { label: 'PPS (Nº 23)', term: 'PPS' },
              { label: 'PTN (Nº 19)', term: 'PTN' },
              { label: 'PTdoB (Nº 70)', term: 'PTdoB' },
              { label: 'União Brasil / PSL', term: 'PSL' },
              { label: 'PPB (Nº 11)', term: 'PPB' },
            ].map((chip) => (
              <button
                key={chip.term}
                type="button"
                onClick={() => setSearchTerm(chip.term)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border ${
                  searchTerm.toUpperCase() === chip.term.toUpperCase()
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterTab('todos')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterTab === 'todos'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Todos ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('disponiveis')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterTab === 'disponiveis'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Disponíveis ({counts.disponiveis})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('com_historico')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  filterTab === 'com_historico'
                    ? 'bg-amber-50 text-amber-800 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <History className="w-3 h-3 text-amber-600" />
                Com Nomes Antigos ({counts.comHistorico})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('selecionados')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  filterTab === 'selecionados'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Na Chapa ({counts.selecionados})
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* RESULTS LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-slate-50/50">
          {resultados.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">
                Nenhuma agremiação encontrada para "{searchTerm}"
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Tente buscar pelo número eleitoral (ex: 15, 25, 45, 10), pela sigla atual ou por siglas históricas conhecidas.
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mt-3 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs rounded-lg transition-colors"
              >
                Limpar filtro de pesquisa
              </button>
            </div>
          ) : (
            resultados.map(
              ({ partido, matchDetail, estaSelecionado, membroAtual, denomNoAno, temHistorico }) => {
                const papelAtual = membroAtual?.papel || papelMap[partido.sigla] || 'Partido Apoiador';
                const isJustAdded = recentlyAdded === partido.sigla;

                return (
                  <div
                    key={`${partido.id || 0}-${partido.numero || 0}-${partido.sigla}`}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 bg-white ${
                      estaSelecionado
                        ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20'
                        : isJustAdded
                        ? 'border-indigo-400 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Party info & Historical context */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Electoral Number Badge */}
                        <div className="flex flex-col items-center justify-center min-w-12 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg shadow-xs">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Nº</span>
                          <span className="text-base font-black font-mono leading-none">{partido.numero}</span>
                        </div>

                        {/* Names & Historical Badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900 font-mono">
                              {partido.sigla}
                            </span>
                            <span className="text-xs text-slate-600 truncate font-medium">
                              {partido.nome || partido.nome_atual}
                            </span>

                            {estaSelecionado && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Na Coligação
                              </span>
                            )}
                          </div>

                          {/* Historical Denomination in Pleito Year */}
                          {denomNoAno.isHistorico && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-md px-2 py-0.5 w-fit">
                              <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>
                                Em <strong>{anoEleicao}</strong> disputava como:{' '}
                                <strong className="font-mono font-bold">{denomNoAno.sigla}</strong>
                                {denomNoAno.nome && denomNoAno.nome !== denomNoAno.sigla && ` (${denomNoAno.nome})`}
                              </span>
                            </div>
                          )}

                          {/* Match Highlight if search hit an old historical name */}
                          {matchDetail &&
                            (matchDetail.tipo === 'nome_antigo' || matchDetail.tipo === 'sigla_antiga') && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 w-fit font-medium">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>
                                  Correspondência por denominação antiga:{' '}
                                  <strong className="underline decoration-amber-400">
                                    {matchDetail.detalheHistorico?.nome
                                      ? `${matchDetail.detalheHistorico.sigla} — ${matchDetail.detalheHistorico.nome}`
                                      : matchDetail.termoCorrespondente}
                                  </strong>
                                  {matchDetail.detalheHistorico?.ano_inicio && (
                                    <span className="text-[11px] text-amber-700/80 ml-1">
                                      ({matchDetail.detalheHistorico.ano_inicio}–
                                      {matchDetail.detalheHistorico.ano_fim || 'atual'})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}

                          {/* Historical Aliases List (if has historical denominations) */}
                          {temHistorico && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1 flex items-center gap-0.5">
                                <History className="w-2.5 h-2.5" />
                                Nomes Anteriores:
                              </span>
                              {partido.historico
                                ?.filter(
                                  (h) =>
                                    !h.is_atual &&
                                    h.sigla.toUpperCase() !== partido.sigla.toUpperCase()
                                )
                                .map((h, idx) => (
                                  <span
                                    key={idx}
                                    title={h.nome || h.sigla}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {h.sigla}
                                    {h.ano_inicio ? ` (${h.ano_inicio}-${h.ano_fim || 'presente'})` : ''}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions / Role selector */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {estaSelecionado ? (
                          <div className="flex items-center gap-2">
                            {/* Role selector for existing member */}
                            <select
                              value={papelAtual}
                              onChange={(e) => {
                                if (onChangePapel) {
                                  onChangePapel(partido.sigla, e.target.value);
                                }
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="Cabeça de Chapa">Cabeça de Chapa</option>
                              <option value="Vice-Prefeito">Vice-Prefeito</option>
                              <option value="Partido Apoiador">Partido Apoiador</option>
                            </select>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => onRemovePartido(partido.sigla)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover partido da coligação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Role selector prior to addition */}
                            <select
                              value={papelMap[partido.sigla] || (partidosSelecionados.length === 0 ? 'Cabeça de Chapa' : partidosSelecionados.length === 1 ? 'Vice-Prefeito' : 'Partido Apoiador')}
                              onChange={(e) =>
                                setPapelMap((prev) => ({ ...prev, [partido.sigla]: e.target.value }))
                              }
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="Partido Apoiador">Partido Apoiador</option>
                              <option value="Vice-Prefeito">Vice-Prefeito</option>
                              <option value="Cabeça de Chapa">Cabeça de Chapa</option>
                            </select>

                            {/* Add button */}
                            <button
                              type="button"
                              onClick={() => handleAdd(partido)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <span>+ Incluir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              Partidos na aliança ({partidosSelecionados.length}):
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {partidosSelecionados.length === 0 ? (
                <span className="text-slate-400 italic">Nenhum selecionado ainda</span>
              ) : (
                partidosSelecionados.map((m) => (
                  <span
                    key={m.sigla_partido}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded font-mono font-bold text-[11px]"
                  >
                    {m.sigla_partido}
                    <button
                      type="button"
                      onClick={() => onRemovePartido(m.sigla_partido)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      &times;
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            Concluir e Retornar ao Formulário
          </button>
        </div>
      </div>
    </div>
  );
};
