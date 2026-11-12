import React, { useEffect, useState, useMemo } from 'react';
import { CandidatoHistoricoDto } from '../types/election';
import { getCandidatoHistorico } from '../services/api';
import { useAppRouter } from '../router/RouterContext';
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
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Share2,
  Printer,
} from 'lucide-react';

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
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs space-y-1.5 min-w-[200px]">
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
          <span className="text-slate-500">Votos da Chapa/Nominais:</span>
          <span className="font-mono font-bold text-blue-700">
            {data.votos.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 pt-0.5">
          {isEleito ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Eleito
            </span>
          ) : isSuplente ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
              <Clock className="w-3.5 h-3.5" /> Suplente
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <XCircle className="w-3.5 h-3.5" /> Não Eleito
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const CandidatoDetailPage: React.FC = () => {
  const { currentRoute, navigate, openCandidato } = useAppRouter();
  const tituloEleitor = currentRoute.params?.titulo || '';

  const [candidato, setCandidato] = useState<CandidatoHistoricoDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tituloEleitor) {
      setError('Título de eleitor não informado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getCandidatoHistorico(tituloEleitor)
      .then((data) => {
        setCandidato(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar dossiê:', err);
        setError('Candidato não encontrado na base de dados das eleições de Braúnas.');
        setLoading(false);
      });
  }, [tituloEleitor]);

  const chapaInfo = useMemo(() => {
    if (!candidato) return null;
    const itemComChapa = candidato.historico.find((h) => h.chapa_parceiro);
    if (!itemComChapa || !itemComChapa.chapa_parceiro) return null;
    return {
      eleicaoAno: itemComChapa.ano,
      parceiro: itemComChapa.chapa_parceiro,
      cargoCandidato: itemComChapa.cargo,
    };
  }, [candidato]);

  const chartData = useMemo(() => {
    if (!candidato || candidato.historico.length === 0) return [];
    return candidato.historico.map((h) => ({
      ano: String(h.ano),
      votos: h.votos,
      partido: h.sigla_partido,
      cargo: h.cargo,
      nomeUrna: h.nome_urna,
      numero: h.numero_urna,
      situacao: h.situacao,
    }));
  }, [candidato]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Carregando dossiê histórico do candidato...
        </p>
      </div>
    );
  }

  if (error || !candidato) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12 shadow-xs space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Registro não localizado</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'Não foi possível encontrar a pessoa física associada a este título eleitoral.'}
        </p>
        <button
          onClick={() => navigate('#/dossie')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Diretório de Candidatos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            title="Imprimir ou Salvar PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir Dossiê</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xl">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Dossiê Político Individual
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Título: {candidato.titulo_eleitor}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {candidato.nome_completo}
              </h1>
              {candidato.data_nascimento && (
                <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Nascimento:{' '}
                    {new Date(candidato.data_nascimento).toLocaleDateString('pt-BR', {
                      timeZone: 'UTC',
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Eleições
              </div>
              <div className="font-mono text-lg font-extrabold text-slate-900 mt-0.5">
                {candidato.total_eleicoes_disputadas}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                Mandatos
              </div>
              <div className="font-mono text-lg font-extrabold text-emerald-700 mt-0.5">
                {candidato.total_mandatos_conquistados}
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Votos Totais
              </div>
              <div className="font-mono text-lg font-extrabold text-blue-800 mt-0.5">
                {candidato.total_votos_acumulados.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Joint Ticket Partner Banner if candidate ran for Prefeito or Vice */}
      {chapaInfo && (
        <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                Chapa Majoritária ({chapaInfo.eleicaoAno})
              </span>
              <div className="text-xs font-semibold text-purple-950">
                Disputou como {chapaInfo.cargoCandidato} em chapa conjunta com{' '}
                <strong className="font-bold underline">{chapaInfo.parceiro.nome_urna}</strong> ({chapaInfo.parceiro.papel})
              </div>
              <div className="text-[11px] text-purple-700 font-mono">
                Título do {chapaInfo.parceiro.papel}: {chapaInfo.parceiro.titulo_eleitor}
              </div>
            </div>
          </div>

          <button
            onClick={() => openCandidato(chapaInfo.parceiro.titulo_eleitor)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            <span>Ver Dossiê do {chapaInfo.parceiro.papel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Historical Voting Trend Evolution Graph */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Evolução Temporal do Número de Votos
              </h2>
              <p className="text-[11px] text-slate-500">
                Trajetória de votos nominais e de chapa nas eleições municipais disputadas
              </p>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="ano"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => Number(val).toLocaleString('pt-BR')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="votos"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            Dados insuficientes para exibição de gráfico temporal.
          </div>
        )}
      </div>

      {/* Complete Historical Chronology Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Histórico Cronológico de Disputas
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {candidato.historico.length} pleito(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Ano</th>
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4">Nome de Urna</th>
                <th className="py-3 px-4">Nº Urna</th>
                <th className="py-3 px-4">Partido</th>
                <th className="py-3 px-4 text-right">Votos</th>
                <th className="py-3 px-4">Situação</th>
                <th className="py-3 px-4 text-center">Posição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidato.historico.map((h, idx) => {
                const isEleito =
                  h.situacao.toLowerCase().includes('eleito') &&
                  !h.situacao.toLowerCase().includes('não');
                const isSuplente = h.situacao.toLowerCase().includes('suplente');

                return (
                  <tr key={`${h.ano}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {h.ano}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {h.cargo}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      "{h.nome_urna}"
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {h.numero_urna}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                        {h.sigla_partido}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-blue-700">
                      {h.votos.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {isEleito ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Eleito
                        </span>
                      ) : isSuplente ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Suplente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <XCircle className="w-3.5 h-3.5" /> Não Eleito
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {h.posicao ? `${h.posicao}º` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
