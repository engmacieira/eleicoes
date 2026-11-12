import React, { useState, useMemo } from 'react';
import {
  DetalhesVotacaoDto,
  ResultadoCandidatoDto,
} from '../types/election';
import {
  Users,
  Vote,
  Percent,
  FileCheck2,
  FileX2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Award,
  ChevronDown,
  Building2,
  Filter,
  Calculator,
  X,
} from 'lucide-react';

interface PleitoOverviewProps {
  ano: number;
  setAno: (ano: number) => void;
  cargo: 'Prefeito' | 'Vereador';
  setCargo: (cargo: 'Prefeito' | 'Vereador') => void;
  detalhes: DetalhesVotacaoDto | null;
  resultados: ResultadoCandidatoDto[];
  loading: boolean;
  onSelectCandidato: (tituloEleitor: string) => void;
}

export const PleitoOverview: React.FC<PleitoOverviewProps> = ({
  ano,
  setAno,
  cargo,
  setCargo,
  detalhes,
  resultados,
  loading,
  onSelectCandidato,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<'todos' | 'eleitos' | 'suplentes' | 'nao_eleitos'>('todos');

  const anosDisponiveis = [2024, 2020, 2016, 2012, 2008, 2004, 2000];

  const filteredResultados = useMemo(() => {
    return resultados.filter((c) => {
      const matchSearch =
        c.nome_urna.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sigla_partido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.numero_urna).includes(searchTerm) ||
        c.titulo_eleitor.includes(searchTerm);

      if (!matchSearch) return false;

      const sit = c.situacao.toLowerCase();
      if (situacaoFilter === 'eleitos') {
        return sit.includes('eleito') && !sit.includes('não');
      }
      if (situacaoFilter === 'suplentes') {
        return sit.includes('suplente');
      }
      if (situacaoFilter === 'nao_eleitos') {
        return sit.includes('não') || sit.includes('nao');
      }

      return true;
    });
  }, [resultados, searchTerm, situacaoFilter]);

  const totalVotosValidos = useMemo(() => {
    if (detalhes && detalhes.validos > 0) return detalhes.validos;
    return resultados.reduce((acc, c) => acc + c.votos, 0);
  }, [detalhes, resultados]);

  // Estimativa do Quociente Eleitoral (9 cadeiras legislativas em Braúnas)
  const quocienteEleitoral = useMemo(() => {
    if (cargo !== 'Vereador' || totalVotosValidos === 0) return null;
    return Math.round(totalVotosValidos / 9);
  }, [cargo, totalVotosValidos]);

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Apuração & Balanço do Pleito ({ano})
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Indicadores consolidados da urna, quociente eleitoral e classificação oficial de candidatos a {cargo} em Braúnas/MG.
        </p>
      </div>

      {/* Controls Bar: Ano e Cargo Selector */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Seletor de Pleito */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Ano da Eleição:
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

          {/* Seletor de Cargo */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Cargo em Disputa:
            </span>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setCargo('Prefeito')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  cargo === 'Prefeito'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Prefeito</span>
              </button>
              <button
                onClick={() => setCargo('Vereador')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  cargo === 'Vereador'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Vereador</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards (4 Column Grid chunking) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Eleitorado Apto */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Eleitorado Apto</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {detalhes ? detalhes.aptos.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            100% da circunscrição municipal
          </div>
        </div>

        {/* Comparecimento */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Comparecimento às Urnas</span>
            <Vote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2 tabular-nums">
            {detalhes ? detalhes.comparecimento.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            {detalhes ? `${detalhes.taxa_comparecimento_pct}% de participação` : '—'}
          </div>
        </div>

        {/* Abstenções */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Taxa de Abstenção</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2 tabular-nums">
            {detalhes ? detalhes.abstencoes.toLocaleString('pt-BR') : '—'}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            {detalhes ? `${detalhes.taxa_abstencao_pct}% não compareceram` : '—'}
          </div>
        </div>

        {/* Votos Válidos */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Votos Válidos</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2 tabular-nums">
            {totalVotosValidos.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {cargo === 'Vereador' ? 'Nominais e de Legenda' : 'Votos computados aos candidatos'}
          </div>
        </div>
      </div>

      {/* Secondary Balance Strip (Urna Balanço: Brancos, Nulos, QE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">Votos em Branco:</span>
          <span className="font-bold text-slate-700 text-sm tabular-nums">
            {detalhes ? detalhes.brancos.toLocaleString('pt-BR') : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {detalhes && detalhes.comparecimento > 0
              ? `${((detalhes.brancos / detalhes.comparecimento) * 100).toFixed(1)}% do comparecimento`
              : ''}
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">Votos Nulos:</span>
          <span className="font-bold text-rose-700 text-sm tabular-nums">
            {detalhes ? detalhes.nulos.toLocaleString('pt-BR') : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {detalhes && detalhes.comparecimento > 0
              ? `${((detalhes.nulos / detalhes.comparecimento) * 100).toFixed(1)}% do comparecimento`
              : ''}
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">
            {cargo === 'Vereador' ? 'Quociente Eleitoral (Estimado):' : 'Margem de Vitória:'}
          </span>
          <span className="font-bold text-blue-700 text-sm tabular-nums flex items-center gap-1">
            {cargo === 'Vereador' ? (
              quocienteEleitoral ? `~${quocienteEleitoral} votos / cadeira` : '—'
            ) : (
              resultados.length >= 2
                ? `${(resultados[0].votos - resultados[1].votos).toLocaleString('pt-BR')} votos`
                : '—'
            )}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {cargo === 'Vereador' ? 'Câmara Municipal (9 vagas)' : 'Diferença 1º x 2º colocado'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs">
          <span className="text-slate-500 block text-[11px]">Candidaturas Registradas:</span>
          <span className="font-bold text-slate-900 text-sm tabular-nums">
            {resultados.length} postulantes
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            com apuração pelo TSE
          </span>
        </div>
      </div>

      {/* Resultados Oficiais Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {/* Table Controls & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>
                Classificação Oficial — {cargo} em {ano}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 ml-1">
                {filteredResultados.length} {filteredResultados.length === 1 ? 'candidato' : 'candidatos'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em qualquer linha ou no botão para abrir o <strong>Dossiê Histórico Completo</strong> do político.
            </p>
          </div>

          {/* Search Input & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar candidato, partido, nº..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 w-60 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSituacaoFilter('todos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  situacaoFilter === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSituacaoFilter('eleitos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  situacaoFilter === 'eleitos' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Eleitos
              </button>
              <button
                onClick={() => setSituacaoFilter('suplentes')}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  situacaoFilter === 'suplentes' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Suplentes
              </button>
              <button
                onClick={() => setSituacaoFilter('nao_eleitos')}
                className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  situacaoFilter === 'nao_eleitos' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Não Eleitos
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            /* Skeleton Loading State */
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3 px-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3 w-1/3">
                    <div className="w-6 h-6 bg-slate-200 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-16" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                  <div className="h-4 bg-slate-200 rounded w-20" />
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
              ))}
            </div>
          ) : filteredResultados.length === 0 ? (
            /* Friendly Empty State */
            <div className="p-12 text-center text-slate-500">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">Nenhum candidato localizado</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Não encontramos candidaturas correspondentes ao termo "{searchTerm}" ou ao filtro selecionado.
              </p>
              {(searchTerm || situacaoFilter !== 'todos') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSituacaoFilter('todos');
                  }}
                  className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Pos</th>
                  <th className="py-3 px-4">Candidato</th>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Partido</th>
                  <th className="py-3 px-4 text-right">Votos Nominais</th>
                  <th className="py-3 px-4 text-right">% Válidos</th>
                  <th className="py-3 px-4 text-center">Situação TSE</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResultados.map((c, index) => {
                  const isEleito =
                    c.situacao.toLowerCase().includes('eleito') &&
                    !c.situacao.toLowerCase().includes('não');
                  const isSuplente = c.situacao.toLowerCase().includes('suplente');

                  return (
                    <tr
                      key={`${c.titulo_eleitor}-${c.posicao ?? 'na'}-${index}`}
                      onClick={() => onSelectCandidato(c.titulo_eleitor)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      {/* Posição */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {c.posicao ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              c.posicao <= 3 && isEleito
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.posicao}º
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Nome Urna & Nome Civil */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 text-sm flex items-center gap-1.5 transition">
                          <span>{c.nome_urna}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition" />
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-xs" title={c.nome_completo}>
                          {c.nome_completo}
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          TÍTULO: {c.titulo_eleitor}
                        </div>
                      </td>

                      {/* Número da Urna */}
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                        {c.numero_urna}
                      </td>

                      {/* Partido */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {c.sigla_partido}
                        </span>
                      </td>

                      {/* Votos */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {c.votos.toLocaleString('pt-BR')}
                      </td>

                      {/* Percentual */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">{c.percentual_validos}%</span>
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 hidden sm:block overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(c.percentual_validos || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isEleito
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isSuplente
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isEleito ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : isSuplente ? (
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <span>{c.situacao}</span>
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidato(c.titulo_eleitor);
                          }}
                          className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-semibold transition cursor-pointer"
                        >
                          Dossiê
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
