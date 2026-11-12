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

  const maxTotalVotos = data && data.partidos.length > 0
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
      {/* Controls Bar: Ano Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>Raio-X Partidário: Eleição Proporcional (Câmara de Vereadores)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Comparação entre <strong>Votos Nominais</strong> (dados aos candidatos) e <strong>Votos de Legenda</strong> (dados ao partido) por agremiação política.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Pleito:
            </span>
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {anosDisponiveis.map((a) => (
                <button
                  key={a}
                  onClick={() => setAno(a)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    ano === a
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Votos Apurados</span>
            <Vote className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-2">
            {totalGeral.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nominais + Legenda</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Votos Nominais Totais</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 mt-2">
            {totalNominais.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-blue-400/80 font-medium mt-1">
            {((totalNominais / totalGeral) * 100).toFixed(1)}% dos votos
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Votos de Legenda Totais</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
            {totalLegenda.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-medium mt-1">
            {((totalLegenda / totalGeral) * 100).toFixed(1)}% fidelidade partidária
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Partidos Concorrentes</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-400 mt-2">
            {data ? data.partidos.length : 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">com chapas registradas</div>
        </div>
      </div>

      {/* Main Bar Chart: Votos Nominais vs. Votos de Legenda */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Força Partidária: Votos Nominais vs. Legenda em {ano}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Barras segmentadas proporcionalmente ao desempenho máximo ({maxTotalVotos.toLocaleString('pt-BR')} votos).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-slate-300">Votos Nominais</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-300">Votos de Legenda</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Carregando desempenho partidário do pleito {ano}...
          </div>
        ) : !data || data.partidos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Nenhum dado partidário registrado para o ano {ano}.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {data.partidos.map((p, index) => {
              const totalPctOfMax = (p.total_votos / maxTotalVotos) * 100;
              const nominalPctOfParty = p.total_votos > 0 ? (p.votos_nominais / p.total_votos) * 100 : 0;
              const legendaPctOfParty = p.total_votos > 0 ? (p.votos_legenda / p.total_votos) * 100 : 0;

              return (
                <div key={`${p.sigla}-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                        {p.sigla}
                      </span>
                      <span className="text-slate-400 text-xs hidden sm:inline">
                        ({p.percentual_total}% da votação geral)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-blue-300 text-xs">
                        Nom: <strong>{p.votos_nominais.toLocaleString('pt-BR')}</strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-300 text-xs">
                        Leg: <strong>{p.votos_legenda.toLocaleString('pt-BR')}</strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-white font-black text-sm">
                        Total: {p.total_votos.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Stacked Bar Container */}
                  <div className="w-full bg-slate-950 rounded-lg h-6 p-1 border border-slate-800 flex overflow-hidden">
                    <div
                      className="h-full flex rounded-md overflow-hidden transition-all duration-500"
                      style={{ width: `${Math.max(totalPctOfMax, 5)}%` }}
                    >
                      {/* Nominais Segment */}
                      <div
                        className="bg-blue-600 hover:bg-blue-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition cursor-default"
                        style={{ width: `${nominalPctOfParty}%` }}
                        title={`${p.sigla} - Votos Nominais: ${p.votos_nominais} (${nominalPctOfParty.toFixed(1)}%)`}
                      >
                        {nominalPctOfParty > 15 && `${p.votos_nominais}`}
                      </div>

                      {/* Legenda Segment */}
                      <div
                        className="bg-emerald-500 hover:bg-emerald-400 h-full flex items-center justify-center text-[10px] font-bold text-slate-950 transition cursor-default"
                        style={{ width: `${legendaPctOfParty}%` }}
                        title={`${p.sigla} - Votos de Legenda: ${p.votos_legenda} (${legendaPctOfParty.toFixed(1)}%)`}
                      >
                        {legendaPctOfParty > 15 && `${p.votos_legenda}`}
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 font-bold text-white text-sm">
            Tabela Detalhada de Desempenho Partidário - Eleição {ano}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold">
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
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.partidos.map((p, index) => {
                  const nomPct = p.total_votos > 0 ? (p.votos_nominais / p.total_votos) * 100 : 0;
                  const legPct = p.total_votos > 0 ? (p.votos_legenda / p.total_votos) * 100 : 0;

                  return (
                    <tr key={`${p.sigla}-${index}`} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        {p.sigla}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-300 font-semibold">
                        {p.votos_nominais.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {nomPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-300 font-semibold">
                        {p.votos_legenda.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {legPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-white font-bold text-sm">
                        {p.total_votos.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400 font-bold">
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
