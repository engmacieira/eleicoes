import React, { useState } from 'react';
import { RaioXPartidario } from '../components/RaioXPartidario';
import { useAppRouter } from '../router/RouterContext';
import { fetchPartidoTimeline } from '../services/api';
import { PartidoTimelineResponse } from '../types/election';
import {
  Search,
  History,
  Award,
  Vote,
  Users,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';

export const PartidosPage: React.FC = () => {
  const { currentRoute, openCandidato } = useAppRouter();
  const initialAno = currentRoute.query?.ano ? parseInt(currentRoute.query.ano, 10) : 2024;
  const [ano, setAno] = useState<number>(initialAno);

  // Timeline Search & Modal State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [timelineData, setTimelineData] = useState<PartidoTimelineResponse | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleBuscarTimeline = async (termoParaBuscar?: string) => {
    const termo = (termoParaBuscar || searchTerm).trim();
    if (!termo) return;

    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const res = await fetchPartidoTimeline(termo);
      if (res && res.partido) {
        setTimelineData(res);
        setIsModalOpen(true);
      } else {
        setTimelineError(`Nenhum registro histórico unificado encontrado para '${termo}'.`);
      }
    } catch (err: any) {
      setTimelineError(err?.message || `Erro ao consultar a linha do tempo para '${termo}'.`);
    } finally {
      setTimelineLoading(false);
    }
  };

  const quickShortcuts = [
    { label: 'AVANTE (70 / PT do B)', termo: '70' },
    { label: 'MDB (15 / PMDB)', termo: '15' },
    { label: 'DEM (25 / PFL)', termo: '25' },
    { label: 'PL (22 / PR)', termo: '22' },
    { label: 'PSDB (45)', termo: '45' },
    { label: 'PT (13)', termo: '13' },
  ];

  return (
    <div className="space-y-6">
      {/* Historical Party Timeline Search Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chave Canônica TSE & Suporte a Rebrandings</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Linha do Tempo Partidária Unificada (2000–2024)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consulte a trajetória histórica de qualquer legenda através de seu <strong>número TSE</strong>,{' '}
              <strong>sigla atual</strong> ou <strong>denominação histórica</strong> (ex:{' '}
              <span className="text-indigo-300 font-mono">70</span>,{' '}
              <span className="text-indigo-300 font-mono">AVANTE</span> ou{' '}
              <span className="text-indigo-300 font-mono">PT do B</span>). O sistema unifica candidaturas, votos e coligações sob a mesma entidade.
            </p>
          </div>

          <div className="w-full lg:w-96 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBuscarTimeline();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Número ou sigla (ex: 70, PT do B...)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={timelineLoading || !searchTerm.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {timelineLoading ? (
                  <span>Buscando...</span>
                ) : (
                  <>
                    <span>Consultar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {timelineError && (
              <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 px-2.5 py-1.5 rounded-lg">
                {timelineError}
              </p>
            )}

            {/* Quick shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Exemplos:</span>
              {quickShortcuts.map((sc) => (
                <button
                  key={sc.termo}
                  type="button"
                  onClick={() => {
                    setSearchTerm(sc.termo);
                    handleBuscarTimeline(sc.termo);
                  }}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition cursor-pointer"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Raio-X Proporcional Component */}
      <RaioXPartidario ano={ano} setAno={setAno} />

      {/* Unified Timeline Modal */}
      {isModalOpen && timelineData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between gap-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black bg-indigo-500 text-white px-3 py-0.5 rounded-lg shadow-xs">
                    Nº {timelineData.partido.numero}
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      <span>{timelineData.partido.sigla_atual || timelineData.partido.sigla}</span>
                      <span className="text-slate-400 font-normal text-sm sm:text-base">
                        — {timelineData.partido.nome_atual || timelineData.partido.nome || 'Agremiação Partidária'}
                      </span>
                    </h2>
                  </div>
                </div>

                {/* Historical Denominations Badges */}
                {timelineData.partido.siglas_anteriores && timelineData.partido.siglas_anteriores.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Denominações Históricas (Aliases):
                    </span>
                    {timelineData.partido.siglas_anteriores.map((siglaAnt, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      >
                        {siglaAnt}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Fechar Linha do Tempo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Aggregated KPIs (4 columns) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Votos Históricos</span>
                    <Vote className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono tabular-nums">
                    {timelineData.estatisticas_gerais.total_votos_historico.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">acumulados 2000–2024</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Eleições</span>
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1 font-mono tabular-nums">
                    {timelineData.estatisticas_gerais.total_eleicoes_disputadas}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">pleitos disputados</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Candidaturas</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-700 mt-1 font-mono tabular-nums">
                    {timelineData.estatisticas_gerais.total_candidatos_historico}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">candidatos lançados</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Mandatos Conquistados</span>
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-mono tabular-nums">
                    {timelineData.estatisticas_gerais.total_eleitos_historico}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {timelineData.estatisticas_gerais.eleitos_prefeito} Pref. · {timelineData.estatisticas_gerais.eleitos_vereador} Ver.
                  </div>
                </div>
              </div>

              {/* Elections Timeline Cards */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Histórico Pleito a Pleito (2000 a 2024)</span>
                </h3>

                {timelineData.eleicoes.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-8">
                    Nenhum registro eleitoral encontrado para este partido no município.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {timelineData.eleicoes.map((el) => (
                      <div
                        key={el.ano}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
                      >
                        {/* Election Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <span className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center font-mono shrink-0">
                              <span className="text-[9px] text-indigo-500 font-bold">ANO</span>
                              <span className="font-extrabold text-indigo-950 text-base">{el.ano}</span>
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  Eleições Municipais de {el.ano}
                                </span>
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                                  Sigla na época: {el.sigla_vigente}
                                </span>
                                {el.is_rebranded && (
                                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Denominação anterior
                                  </span>
                                )}
                              </div>
                              {el.nome_coligacao && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Coligação:{' '}
                                  <strong className="text-slate-700">{el.nome_coligacao}</strong>
                                  {el.composicao_coligacao && ` (${el.composicao_coligacao})`}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono tabular-nums sm:text-right">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {el.total_votos.toLocaleString('pt-BR')} votos
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Nominais: {el.votos_nominais} · Legenda: {el.votos_legenda}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Candidates in this election */}
                        {el.candidatos && el.candidatos.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold">
                                <tr>
                                  <th className="py-2 px-3">Cargo</th>
                                  <th className="py-2 px-3">Candidato</th>
                                  <th className="py-2 px-3 font-mono">Número</th>
                                  <th className="py-2 px-3 text-right">Votos</th>
                                  <th className="py-2 px-3 text-center">Situação</th>
                                  <th className="py-2 px-3 text-right">Ação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                                {el.candidatos.map((c, cIdx) => {
                                  const isEleito =
                                    c.situacao.toLowerCase().includes('eleito') &&
                                    !c.situacao.toLowerCase().includes('não');
                                  const isSuplente = c.situacao.toLowerCase().includes('suplente');

                                  return (
                                    <tr key={cIdx} className="hover:bg-slate-50/80 transition">
                                      <td className="py-2 px-3 font-sans font-semibold text-slate-700">
                                        {c.cargo}
                                      </td>
                                      <td className="py-2 px-3 font-sans">
                                        <div className="font-bold text-slate-900">{c.nome_urna}</div>
                                        {c.nome_completo && c.nome_completo !== c.nome_urna && (
                                          <div className="text-[10px] text-slate-400 font-normal">
                                            {c.nome_completo}
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-blue-700 font-bold">{c.numero_urna}</td>
                                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                                        {c.votos.toLocaleString('pt-BR')}
                                      </td>
                                      <td className="py-2 px-3 text-center font-sans">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            isEleito
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                              : isSuplente
                                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                                              : 'bg-slate-100 text-slate-600 border-slate-200'
                                          }`}
                                        >
                                          {isEleito && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                          <span>{c.situacao}</span>
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right font-sans">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsModalOpen(false);
                                            openCandidato(c.titulo_eleitor);
                                          }}
                                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                        >
                                          Dossiê
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Identidade Canônica: Número TSE <strong className="text-slate-700">{timelineData.partido.numero}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
