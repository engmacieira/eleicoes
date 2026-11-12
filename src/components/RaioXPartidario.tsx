import React, { useEffect, useState } from 'react';
import { PartidosAnoDto } from '../types/election';
import { getPartidosAno } from '../services/api';
import {
  BarChart3,
  Calendar,
  Vote,
  Award,
  Layers,
  TrendingUp,
  Percent,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

interface RaioXPartidarioProps {
  ano: number;
  setAno: (ano: number) => void;
}

export const RaioXPartidario: React.FC<RaioXPartidarioProps> = ({ ano, setAno }) => {
  const [data, setData] = useState<PartidosAnoDto | null>(null);
  const [loading, setLoading] = useState(false);

  const anosDisponiveis = [2024, 2020, 2016, 2012, 2008, 2004, 2000];

  useEffect(() => {
    setLoading(true);
    getPartidosAno(ano)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [ano]);

  const maxTotalVotos =
    data && data.partidos.length > 0
      ? Math.max(...data.partidos.map((p) => p.total_votos), 1)
      : 1;

  const totalNominais = data
    ? data.partidos.reduce((acc, p) => acc + p.votos_nominais, 0)
    : 0;
  const totalLegenda = data
    ? data.partidos.reduce((acc, p) => acc + p.votos_legenda, 0)
    : 0;
  const totalGeral = totalNominais + totalLegenda || 1;

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Raio-X Partidário: Eleição Proporcional ({ano})
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Desempenho eleitoral das legendas para a Câmara Municipal. Comparação entre <strong>Votos Nominais</strong> (preferência pelo candidato) e <strong>Votos de Legenda</strong> (fidelidade partidária).
        </p>
      </div>

      {/* Controls Bar: Ano Selector */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Ano do Pleito:
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

          <div className="text-xs text-slate-500 font-medium">
            Tabela Relacional: <code className="text-blue-700 font-mono">partidos_eleicao</code>
          </div>
        </div>
      </div>

      {/* Aggregate KPIs (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Votos Apurados</span>
            <Vote className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {totalGeral.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Nominais + Legenda (Câmara)</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Votos Nominais Totais</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2 tabular-nums">
            {totalNominais.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-blue-700 font-medium mt-1">
            {((totalNominais / totalGeral) * 100).toFixed(1)}% do eleitorado
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Votos de Legenda Totais</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2 tabular-nums">
            {totalLegenda.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            {((totalLegenda / totalGeral) * 100).toFixed(1)}% de votos na sigla
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Partidos Concorrentes</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2 tabular-nums">
            {data ? data.partidos.length : 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">chapas registradas em {ano}</div>
        </div>
      </div>

      {/* Main Bar Chart: Segmented Stacked Comparison */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Força Partidária: Votos Nominais vs. Legenda em {ano}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Barras segmentadas proporcionalmente à agremiação mais votada ({maxTotalVotos.toLocaleString('pt-BR')} votos).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-slate-700">Votos Nominais</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600" />
              <span className="text-slate-700">Votos de Legenda</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-6 bg-slate-100 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : !data || data.partidos.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              Nenhum dado partidário registrado para o ano {ano}.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {data.partidos.map((p, index) => {
              const totalPctOfMax = (p.total_votos / maxTotalVotos) * 100;
              const nominalPctOfParty =
                p.total_votos > 0 ? (p.votos_nominais / p.total_votos) * 100 : 0;
              const legendaPctOfParty =
                p.total_votos > 0 ? (p.votos_legenda / p.total_votos) * 100 : 0;

              return (
                <div key={`${p.sigla}-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {p.sigla}
                      </span>
                      <span className="text-slate-500 text-xs hidden sm:inline">
                        ({p.percentual_total}% da votação geral)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                      <span className="text-blue-700">
                        Nom: <strong>{p.votos_nominais.toLocaleString('pt-BR')}</strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-emerald-700">
                        Leg: <strong>{p.votos_legenda.toLocaleString('pt-BR')}</strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-900 font-extrabold text-sm">
                        Total: {p.total_votos.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Stacked Bar Container */}
                  <div className="w-full bg-slate-100 rounded-lg h-6 p-0.5 border border-slate-200 flex overflow-hidden">
                    <div
                      className="h-full flex rounded-md overflow-hidden transition-all duration-500"
                      style={{ width: `${Math.max(totalPctOfMax, 6)}%` }}
                    >
                      {/* Nominais Segment */}
                      <div
                        className="bg-blue-600 hover:bg-blue-700 h-full flex items-center justify-center text-[10px] font-bold text-white transition cursor-default"
                        style={{ width: `${nominalPctOfParty}%` }}
                        title={`${p.sigla} - Votos Nominais: ${p.votos_nominais} (${nominalPctOfParty.toFixed(1)}%)`}
                      >
                        {nominalPctOfParty > 18 && `${p.votos_nominais}`}
                      </div>

                      {/* Legenda Segment */}
                      <div
                        className="bg-emerald-600 hover:bg-emerald-700 h-full flex items-center justify-center text-[10px] font-bold text-white transition cursor-default"
                        style={{ width: `${legendaPctOfParty}%` }}
                        title={`${p.sigla} - Votos de Legenda: ${p.votos_legenda} (${legendaPctOfParty.toFixed(1)}%)`}
                      >
                        {legendaPctOfParty > 18 && `${p.votos_legenda}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Table */}
      {data && data.partidos.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-200/80 font-bold text-slate-900 text-sm">
            Tabela Detalhada de Desempenho Partidário — Eleição {ano}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Partido</th>
                  <th className="py-3 px-4 text-right">Votos Nominais</th>
                  <th className="py-3 px-4 text-right">% Nominais</th>
                  <th className="py-3 px-4 text-right">Votos de Legenda</th>
                  <th className="py-3 px-4 text-right">% Legenda</th>
                  <th className="py-3 px-4 text-right">Total de Votos</th>
                  <th className="py-3 px-4 text-right">Participação Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {data.partidos.map((p, index) => {
                  const nomPct =
                    p.total_votos > 0 ? (p.votos_nominais / p.total_votos) * 100 : 0;
                  const legPct =
                    p.total_votos > 0 ? (p.votos_legenda / p.total_votos) * 100 : 0;

                  return (
                    <tr key={`${p.sigla}-${index}`} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm font-sans">
                        {p.sigla}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-700 font-semibold">
                        {p.votos_nominais.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {nomPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                        {p.votos_legenda.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {legPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 font-extrabold text-sm">
                        {p.total_votos.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-700 font-bold">
                        {p.percentual_total}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
