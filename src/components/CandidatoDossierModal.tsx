import React, { useEffect, useState } from 'react';
import { CandidatoHistoricoDto } from '../types/election';
import { getCandidatoHistorico } from '../services/api';
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
  Share2,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface CandidatoDossierModalProps {
  tituloEleitor: string | null;
  onClose: () => void;
  onSelectAnother: (titulo: string) => void;
}

export const CandidatoDossierModal: React.FC<CandidatoDossierModalProps> = ({
  tituloEleitor,
  onClose,
  onSelectAnother,
}) => {
  const [data, setData] = useState<CandidatoHistoricoDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!tituloEleitor) return null;

  const maxVotos = data ? Math.max(...data.historico.map((h) => h.votos), 1) : 1;
  const partidosDistintos = data
    ? Array.from(new Set(data.historico.map((h) => h.sigla_partido)))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-850 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                  Dossiê Político TSE
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Título: {tituloEleitor}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {data ? data.nome_completo : 'Carregando candidato...'}
              </h2>
              {data?.data_nascimento && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nascimento: {data.data_nascimento}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Fechar Dossiê"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <span>Consultando registros de 2000 a 2024 no Cloud SQL...</span>
            </div>
          ) : error || !data ? (
            <div className="py-12 text-center text-red-400">
              {error || 'Dados indisponíveis'}
            </div>
          ) : (
            <>
              {/* Career KPI Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pleitos Disputados</span>
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {data.total_eleicoes_disputadas}
                  </div>
                  <div className="text-[10px] text-slate-400">eleições municipais</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mandatos Conquistados</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {data.total_mandatos_conquistados}
                  </div>
                  <div className="text-[10px] text-amber-400/80">vitórias eleitorais</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Vote className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Votos Acumulados</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {data.total_votos_acumulados.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-emerald-400/80">votos nominais</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                    <span>Legendas Disputadas</span>
                  </div>
                  <div className="text-2xl font-black text-purple-400 mt-1">
                    {partidosDistintos.length}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate" title={partidosDistintos.join(', ')}>
                    {partidosDistintos.join(', ')}
                  </div>
                </div>
              </div>

              {/* Trajetória de Votação (Gráfico Visual Comparativo) */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span>Evolução do Desempenho Eleitoral (2000 - 2024)</span>
                  </span>
                  <span>Escala máxima: {maxVotos.toLocaleString('pt-BR')} votos</span>
                </div>

                <div className="space-y-2 pt-2">
                  {data.historico.map((h) => {
                    const pct = (h.votos / maxVotos) * 100;
                    const isEleito =
                      h.situacao.toLowerCase().includes('eleito') &&
                      !h.situacao.toLowerCase().includes('não');

                    return (
                      <div key={`${h.ano}-${h.cargo}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white text-sm w-12">
                              {h.ano}
                            </span>
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-blue-300">
                              {h.sigla_partido}
                            </span>
                            <span className="text-slate-300 font-medium">{h.cargo}</span>
                            <span className="text-slate-400 text-[11px]">"{h.nome_urna}"</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white">
                              {h.votos.toLocaleString('pt-BR')} votos
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isEleito
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {h.situacao}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-850 rounded-full h-3 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isEleito
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                            }`}
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Participation Timeline Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
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
                            ? 'bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-700'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center font-mono shrink-0">
                            <span className="text-[10px] text-slate-400">PLEITO</span>
                            <span className="font-bold text-white text-sm">{h.ano}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {h.cargo} • Urna: {h.nome_urna}
                              </span>
                              <span className="font-mono text-xs text-amber-400 font-bold">
                                Nº {h.numero_urna}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Legenda: <strong className="text-blue-300 font-mono">{h.sigla_partido}</strong></span>
                              <span>•</span>
                              <span>Colocação: {h.posicao ? `${h.posicao}º lugar` : 'N/D'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:text-right">
                          <div>
                            <div className="text-base font-black text-white font-mono">
                              {h.votos.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase">Votos Recebidos</div>
                          </div>

                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border shrink-0 ${
                              isEleito
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : isSuplente
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isEleito ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : isSuplente ? (
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
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

        {/* Modal Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dados auditados pelo TSE • Google Cloud SQL (PostgreSQL)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
