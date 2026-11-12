import React, { useEffect, useState, useMemo } from 'react';
import { CandidatoHistoricoDto } from '../types/election';
import { getCandidatoHistorico } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  X,
  User,
  Calendar,
  Award,
  Vote,
  TrendingUp,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

interface CandidatoDossierModalProps {
  tituloEleitor: string | null;
  onClose: () => void;
  onSelectAnother?: (titulo: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isEleito =
      data.situacao.toLowerCase().includes('eleito') &&
      !data.situacao.toLowerCase().includes('não');
    const isSuplente = data.situacao.toLowerCase().includes('suplente');

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs space-y-1.5 min-w-[190px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="font-bold text-slate-900 font-mono text-sm">
            Eleição {label}
          </span>
          <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
            {data.partido}
          </span>
        </div>

        <div>
          <div className="text-slate-500 text-[11px]">
            {data.cargo} · Nº {data.numero}
          </div>
          <div className="font-semibold text-slate-800">
            "{data.nomeUrna}"
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
          <span className="text-slate-500">Votos Recebidos:</span>
          <span className="font-mono font-bold text-blue-700 text-sm tabular-nums">
            {data.votos.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold pt-0.5">
          {isEleito ? (
            <span className="text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {data.situacao}
            </span>
          ) : isSuplente ? (
            <span className="text-amber-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {data.situacao}
            </span>
          ) : (
            <span className="text-slate-600 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              {data.situacao}
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const CandidatoDossierModal: React.FC<CandidatoDossierModalProps> = ({
  tituloEleitor,
  onClose,
  onSelectAnother,
}) => {
  const [data, setData] = useState<CandidatoHistoricoDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Esc key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (tituloEleitor) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [tituloEleitor, onClose]);

  useEffect(() => {
    if (!tituloEleitor) return;
    setLoading(true);
    setError(null);
    getCandidatoHistorico(tituloEleitor)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Não foi possível carregar o histórico deste candidato.');
        setLoading(false);
      });
  }, [tituloEleitor]);

  // Chronologically sorted data for the Recharts line chart
  const chartData = useMemo(() => {
    if (!data || !data.historico) return [];
    return [...data.historico]
      .sort((a, b) => a.ano - b.ano)
      .map((h) => ({
        ano: String(h.ano),
        anoNum: h.ano,
        votos: h.votos,
        cargo: h.cargo,
        partido: h.sigla_partido,
        nomeUrna: h.nome_urna,
        situacao: h.situacao,
        posicao: h.posicao,
        numero: h.numero_urna,
      }));
  }, [data]);

  if (!tituloEleitor) return null;

  const maxVotos = data ? Math.max(...data.historico.map((h) => h.votos), 1) : 1;
  const partidosDistintos = data
    ? Array.from(new Set(data.historico.map((h) => h.sigla_partido)))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out border-l border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dossier-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Dossiê Político TSE
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Título: {tituloEleitor}
                </span>
              </div>
              <h2 id="dossier-title" className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                {data ? data.nome_completo : 'Consultando candidato...'}
              </h2>
              {data?.data_nascimento && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Data de Nascimento: {data.data_nascimento}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            aria-label="Fechar dossiê"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {loading ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm font-medium">Buscando histórico eleitoral no Cloud SQL...</p>
            </div>
          ) : error || !data ? (
            <div className="py-16 text-center text-rose-600 space-y-2">
              <XCircle className="w-10 h-10 mx-auto text-rose-400" />
              <p className="text-sm font-semibold">{error || 'Dados indisponíveis'}</p>
            </div>
          ) : (
            <>
              {/* Career KPI Stats (4 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pleitos</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                    {data.total_eleicoes_disputadas}
                  </div>
                  <div className="text-[11px] text-slate-500">eleições municipais</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mandatos</span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-700 mt-1 tabular-nums">
                    {data.total_mandatos_conquistados}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">vitórias eleitorais</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <Vote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Votos Acumulados</span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
                    {data.total_votos_acumulados.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">votos nominais</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                    <span>Legendas</span>
                  </div>
                  <div className="text-2xl font-extrabold text-purple-700 mt-1 tabular-nums">
                    {partidosDistintos.length}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate" title={partidosDistintos.join(', ')}>
                    {partidosDistintos.join(', ')}
                  </div>
                </div>
              </div>

              {/* RECHARTS LINE CHART: Evolução do Número de Votos */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-slate-900 text-sm">
                      Evolução Histórica do Número de Votos
                    </span>
                  </div>
                  <span className="text-slate-500 text-xs font-mono tabular-nums">
                    {chartData.length} {chartData.length === 1 ? 'pleito disputado' : 'pleitos disputados'}
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 12, right: 16, left: -10, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="ano"
                        stroke="#64748b"
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#475569', fontSize: 11 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="votos"
                        stroke="#1d4ed8"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          fill: '#1d4ed8',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 7,
                          fill: '#2563eb',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Passe o cursor sobre os pontos para visualizar partido, cargo e resultado do pleito.
                </p>
              </div>

              {/* Detailed Participation Timeline Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  <span>Cronologia Oficial das Candidaturas</span>
                </h3>

                <div className="space-y-2.5">
                  {data.historico.map((h, index) => {
                    const isEleito =
                      h.situacao.toLowerCase().includes('eleito') &&
                      !h.situacao.toLowerCase().includes('não');
                    const isSuplente = h.situacao.toLowerCase().includes('suplente');

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isEleito
                            ? 'bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-400'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-mono shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold">ANO</span>
                            <span className="font-extrabold text-slate-900 text-sm">{h.ano}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {h.cargo} · Urna: {h.nome_urna}
                              </span>
                              <span className="font-mono text-xs text-blue-700 font-bold">
                                Nº {h.numero_urna}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>Legenda: <strong className="text-slate-800 font-mono">{h.sigla_partido}</strong></span>
                              <span>·</span>
                              <span>Colocação: {h.posicao ? `${h.posicao}º lugar` : 'N/D'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:text-right">
                          <div>
                            <div className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                              {h.votos.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Votos Recebidos</div>
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border shrink-0 ${
                              isEleito
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isSuplente
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isEleito ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isSuplente ? (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{h.situacao}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dados auditados pelo TSE · Google Cloud SQL</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition cursor-pointer"
          >
            Fechar Dossiê
          </button>
        </div>
      </div>
    </div>
  );
};
